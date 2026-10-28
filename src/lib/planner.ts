/**
 * 조건 기반 일정 생성기 (AI 연동 전 단계의 규칙 기반 버전)
 *
 * 1) 장소 점수: 여행 스타일 일치 · 인기도 · 요청사항 키워드
 * 2) 날짜별 배치: 비 예보일은 실내 장소만, 하루짜리 장소(테마파크)는 맑은 날 단독 배치
 * 3) 동선: 기준 장소에서 가장 가까운 곳을 차례로 고르는 nearest-neighbor 방식
 * 4) 시간·비용: 이동 수단(도보/대중교통)과 머무는 시간으로 일정표를 만들고 예산을 합산
 *
 * 나중에 LLM 응답으로 바꿔도 화면은 그대로 쓸 수 있게 Itinerary 타입만 맞춰 반환해요.
 */
import type { DailyForecast, Destination, TravelStyle, TripDraft } from '@/types/trip';
import type { DayPlan, Itinerary, Leg, Place, Stop } from '@/types/itinerary';
import { addDays, diffDays } from './date';
import { distanceKm } from './geo';
import { toHHMM, toMinutes } from './time';
import { CATEGORY_LABEL } from '@/data/places';

const DAY_START = '09:30';
const WALK_LIMIT_KM = 1.2;
const TRANSIT_FARE = 2500;

export interface Preferences {
  lessWalking: boolean;
  relaxed: boolean;
  localFood: boolean;
}

export const readPreferences = (request: string): Preferences => ({
  lessWalking: /(덜|많이)\s*걷|걷지\s*않|걷는\s*게\s*힘|부모님|어르신|유모차/.test(request),
  relaxed: /여유|천천히|느긋|쉬엄/.test(request),
  localFood: /현지|맛집|로컬/.test(request),
});

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const legBetween = (a: Place, b: Place, prefs?: Pick<Preferences, 'lessWalking'>): Leg => {
  const km = Math.round(distanceKm(a, b) * 10) / 10;
  const walkLimit = prefs?.lessWalking ? 0.6 : WALK_LIMIT_KM;
  if (km <= walkLimit) return { mode: 'walk', km, minutes: Math.max(3, Math.round((km / 4.5) * 60)), cost: 0 };
  return { mode: 'transit', km, minutes: Math.round(8 + km * 2.6), cost: TRANSIT_FARE };
};

const STYLE_REASON: Record<TravelStyle, string> = {
  food: '맛집 탐방 선호',
  nature: '자연 · 바다 선호',
  culture: '문화 · 역사 선호',
  cafe: '카페 투어 선호',
  shopping: '쇼핑 선호',
  activity: '액티비티 선호',
};

const score = (p: Place, styles: TravelStyle[], prefs: Preferences) => {
  let s = p.popularity / 10;
  if (styles.includes(p.category)) s += 4;
  if (prefs.localFood && p.category === 'food') s += 2;
  if (prefs.lessWalking && p.duration >= 150 && !p.fullDay) s -= 3; // 긴 하이킹 등
  return s;
};

const THEME_WORD: Record<string, string> = {
  food: '먹방', shopping: '쇼핑', culture: '산책', nature: '산책', activity: '즐기기', cafe: '카페 투어',
};

const dayTitle = (places: Place[]) => {
  if (places.length === 0) return '자유 일정';
  if (places.some((p) => p.fullDay)) return `${places.find((p) => p.fullDay)!.name} 하루 종일`;
  // 실제 API 장소는 동네 이름 대신 도시 이름만 오는 경우가 많아서, 대표 장소 이름으로 제목을 지어요
  const live = places.every((p) => p.id.startsWith('fsq:'));
  // 식당·카페보다는 명소를 기준으로 삼아야 제목이 알아보기 쉬워요
  const anchor = [...places].sort(
    (a, b) =>
      Number(a.category === 'food' || a.category === 'cafe') - Number(b.category === 'food' || b.category === 'cafe') ||
      b.popularity - a.popularity,
  )[0];
  const areas = live ? [`${anchor.name} 주변`] : [...new Set(places.map((p) => p.area))].slice(0, 2);
  const counts = places.reduce<Record<string, number>>((acc, p) => ((acc[p.category] = (acc[p.category] ?? 0) + 1), acc), {});
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  return `${areas.join(' · ')} ${THEME_WORD[top]}`;
};

/** 장소 목록 → 시간표·이동 구간·이유가 채워진 하루 일정 */
export const buildDay = (
  base: Pick<DayPlan, 'date' | 'rainy' | 'forecast' | 'startTime'>,
  places: Place[],
  ctx: { styles: TravelStyle[]; prefs: Preferences; existing?: Stop[]; keepTitle?: string },
): DayPlan => {
  const stops: Stop[] = [];
  const legs: Leg[] = [];
  let clock = toMinutes(base.startTime || DAY_START);
  let hadMeal = false;

  places.forEach((p, i) => {
    if (i > 0) {
      const leg = legBetween(places[i - 1], p, ctx.prefs);
      legs.push(leg);
      clock += leg.minutes;
    }
    // 식사 시간 맞추기: 점심은 11:30 이후, 이미 점심을 먹었거나 오후 늦게 닿으면 저녁(17:30 이후)으로.
    // 그 사이 빈 시간은 화면에서 '자유 시간'으로 보여줘요.
    if (p.category === 'food' && i > 0) {
      if (hadMeal || clock >= toMinutes('14:30')) clock = Math.max(clock, toMinutes('17:30'));
      else clock = Math.max(clock, toMinutes('11:30'));
    }
    if (p.category === 'food') hadMeal = true;
    const start = clock;
    clock += p.duration;

    const prev = ctx.existing?.find((s) => s.placeId === p.id);
    const reasons: string[] = [];
    if (ctx.styles.includes(p.category)) reasons.push(STYLE_REASON[p.category]);
    if (p.category === 'food' && start >= toMinutes('11:00') && start <= toMinutes('14:00')) reasons.push('점심 시간대');
    if (p.category === 'food' && start >= toMinutes('17:00')) reasons.push('저녁 시간대');
    if (base.rainy && p.indoor) reasons.push(`비 예보(${base.forecast.rainChance}%)라 실내 장소`);
    if (p.fullDay) reasons.push('하루를 통째로 쓰는 일정이라 맑은 날에 배치');
    const next = places[i + 1];
    if (next) {
      const l = legBetween(p, next, ctx.prefs);
      reasons.push(`다음 장소까지 ${l.mode === 'walk' ? '도보' : '대중교통'} ${l.minutes}분`);
    }
    if (ctx.prefs.lessWalking && next && legBetween(p, next, ctx.prefs).mode === 'transit') reasons.push('덜 걷기 요청 반영');

    stops.push({
      id: prev?.id ?? uid('stop'),
      placeId: p.id,
      start: toHHMM(start),
      end: toHHMM(clock),
      reasons: reasons.length ? reasons : [`${CATEGORY_LABEL[p.category]} 추천 장소`],
    });
  });

  return { ...base, title: ctx.keepTitle ?? dayTitle(places), stops, legs };
};

interface GenerateInput {
  draft: TripDraft;
  destination: Destination;
  forecast: DailyForecast[];
  places: Place[];
}

export function planItinerary({ draft, destination, forecast, places }: GenerateInput): Itinerary {
  const prefs = readPreferences(draft.request);
  const dayCount = Math.min(7, Math.max(1, diffDays(draft.startDate, draft.endDate) + 1));
  const used = new Set<string>();
  const ranked = [...places].sort((a, b) => score(b, draft.styles, prefs) - score(a, draft.styles, prefs));

  const dates = Array.from({ length: dayCount }, (_, i) => addDays(draft.startDate, i));
  const meta = dates.map((date, i) => {
    const f = forecast.find((x) => x.date === date) ?? forecast[i] ?? { high: destination.climate.high, low: destination.climate.low, rainChance: destination.climate.rainChance };
    return {
      date,
      rainy: f.rainChance >= 40,
      forecast: { high: f.high, low: f.low, rainChance: f.rainChance },
      // 도착일은 오후 1시부터 시작해요
      startTime: i === 0 && dayCount > 1 ? '13:00' : DAY_START,
    };
  });

  // 하루짜리 장소(테마파크)는 스타일이 맞을 때만, 첫날·마지막 날이 아닌 맑은 날에 배치
  const fullDayPlan = new Map<number, Place>();
  const fullDay = ranked.find((p) => p.fullDay && draft.styles.includes(p.category));
  if (fullDay && dayCount >= 3) {
    const idx = meta.findIndex((m, i) => i > 0 && i < dayCount - 1 && !m.rainy);
    if (idx >= 0) {
      fullDayPlan.set(idx, fullDay);
      used.add(fullDay.id);
    }
  }

  // 하루 틀: 오전 관광 → 점심 → 오후 관광(카페) → 저녁. 여유/덜 걷기 요청이면 오후 관광을 하나 줄여요.
  type Slot = 'sight' | 'lunch' | 'dinner';
  const slotsFor = (i: number): Slot[] => {
    const easy = prefs.relaxed || prefs.lessWalking;
    if (dayCount > 1 && i === 0) return easy ? ['sight', 'sight', 'dinner'] : ['sight', 'sight', 'sight', 'dinner']; // 도착일: 오후 + 저녁
    if (dayCount > 1 && i === dayCount - 1) return easy ? ['sight', 'lunch'] : ['sight', 'lunch', 'sight']; // 출발일: 오후 일찍 마무리
    return easy ? ['sight', 'lunch', 'sight', 'dinner'] : ['sight', 'lunch', 'sight', 'sight', 'dinner'];
  };

  const pickNear = (pool: Place[], from: Place | undefined, filter: (p: Place) => boolean, chosen: Place[]) => {
    const usedCats = chosen.map((p) => p.category);
    const candidates = pool.filter((p) => !chosen.includes(p) && filter(p));
    if (candidates.length === 0) return undefined;
    // 가까움(1km ≈ 1점) + 점수 - 같은 날 같은 카테고리 반복 감점
    const value = (p: Place) =>
      score(p, draft.styles, prefs) - (from ? distanceKm(from, p) : 0) - usedCats.filter((c) => c === p.category).length * 2.5;
    return candidates.sort((a, b) => value(b) - value(a))[0];
  };

  const days: DayPlan[] = meta.map((m, i) => {
    const fixed = fullDayPlan.get(i);
    const pool = ranked.filter((p) => !used.has(p.id) && !p.fullDay && (!m.rainy || p.indoor));
    const isFood = (p: Place) => p.category === 'food';
    const isSight = (p: Place) => !isFood(p);

    let chosen: Place[] = [];
    if (fixed) {
      // 테마파크 + 근처 저녁 식사 한 곳
      const dinner = pickNear(pool, fixed, isFood, []) ?? pickNear(ranked.filter((p) => !used.has(p.id) && !p.fullDay), fixed, isFood, []);
      chosen = dinner ? [fixed, dinner] : [fixed];
    } else {
      for (const slot of slotsFor(i)) {
        const last = chosen[chosen.length - 1];
        const want = slot === 'sight' ? isSight : isFood;
        const next = pickNear(pool, last, want, chosen) ?? pickNear(pool, last, () => true, chosen);
        if (next) chosen.push(next);
      }
    }
    chosen.forEach((p) => used.add(p.id));
    return buildDay(m, chosen, { styles: draft.styles, prefs });
  });

  // 숙박: 1인 예산 중간값의 약 30%를 숙박으로 잡아요
  const nights = Math.max(0, dayCount - 1);
  const mid = (draft.budget[0] + draft.budget[1]) / 2;
  const lodgingPerPerson = nights ? Math.round((mid * 0.3) / 1000) * 1000 : 0;

  return {
    id: uid('trip'),
    destinationId: destination.id,
    createdAt: new Date().toISOString(),
    days,
    lodgingPerPerson,
    budget: draft.budget,
    request: draft.request,
    styles: draft.styles,
    adults: draft.adults,
    children: draft.children,
  };
}

/**
 * 장소 묶음을 동선이 짧은 순서로 다시 놓아요 (AI 수정 결과처럼 순서가 오락가락할 때).
 * 7곳 이하라 모든 순서를 비교해요. 마지막 장소(저녁)는 그대로 둬요. 아침 첫 장소가 식당이거나 식당이 연달아 오면 감점해요.
 * 원래 순서보다 이동 거리가 15% 이상 줄 때만 바꿔서, 의도한 순서는 되도록 지켜요.
 */
export function orderForRoute(places: Place[]): Place[] {
  if (places.length < 3 || places.length > 7 || places.some((p) => p.fullDay)) return places;
  const km = (list: Place[]) => list.slice(1).reduce((s, p, i) => s + distanceKm(list[i], p), 0);
  const penalty = (list: Place[]) =>
    (list[0].category === 'food' ? 6 : 0) +
    list.slice(1).filter((p, i) => p.category === 'food' && list[i].category === 'food').length * 4;
  const cost = (list: Place[]) => km(list) + penalty(list);

  // 마지막 장소(보통 저녁 식사)는 자리를 지키고, 나머지 순서만 바꿔요
  const last = places[places.length - 1];
  let best = places;
  let bestCost = cost(places);
  const permute = (rest: Place[], acc: Place[]) => {
    if (rest.length === 0) {
      const c = cost([...acc, last]);
      if (c < bestCost) {
        best = [...acc, last];
        bestCost = c;
      }
      return;
    }
    rest.forEach((p, i) => permute([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, p]));
  };
  permute(places.slice(0, -1), []);
  return km(best) < km(places) * 0.85 ? best : places;
}

/** 하루 지출(1인): 장소 비용 + 교통비 */
export const daySpend = (day: DayPlan, placeOf: (id: string) => Place | null) =>
  day.stops.reduce((sum, s) => sum + (placeOf(s.placeId)?.cost ?? 0), 0) + day.legs.reduce((sum, l) => sum + l.cost, 0);

/** 하루 예산 = (최대 예산 - 숙박) / 일수 */
export const dailyBudget = (it: Itinerary) => Math.round((it.budget[1] - it.lodgingPerPerson) / it.days.length);
