import type { DayPlan, Itinerary, Place, PlaceCategory } from '@/types/itinerary';
import { daySpend, dailyBudget } from '@/lib/planner';
import { weekday } from '@/lib/date';
import { withEul } from '@/lib/korean';

export type BudgetKey = 'lodging' | 'food' | 'entry' | 'shopping' | 'transport';

export interface BudgetSlice {
  key: BudgetKey;
  label: string;
  value: number;
  /** CSS 변수 이름 — 차트에서는 계산된 색으로 바꿔 써요 */
  colorVar: string;
}

export interface DaySummary {
  index: number;
  date: string;
  title: string;
  route: string[];
  moreCount: number;
  walkKm: number;
  spend: number;
  /** 하루 예산을 넘은 금액 (넘지 않으면 0) */
  over: number;
  image: string;
}

const BUDGET_GROUP: Record<PlaceCategory, BudgetKey> = {
  food: 'food',
  cafe: 'food',
  culture: 'entry',
  nature: 'entry',
  activity: 'entry',
  shopping: 'shopping',
};

const CATEGORY_ICON: Record<PlaceCategory, string> = {
  food: '/images/3d-food.jpg',
  nature: '/images/3d-nature.jpg',
  culture: '/images/3d-culture.jpg',
  cafe: '/images/3d-cafe.jpg',
  shopping: '/images/3d-shopping.jpg',
  activity: '/images/3d-activity.jpg',
};

export const isRainyDay = (d: DayPlan) => d.rainy || d.forecast.rainChance >= 40;

type PlaceOf = (id: string) => Place | null;

/** 그날을 대표하는 아이콘: 비 오는 날은 비 아이콘, 아니면 가장 오래 머무는 장소의 카테고리 */
const dayImage = (day: DayPlan, placeOf: PlaceOf) => {
  if (isRainyDay(day)) return '/images/3d-weather-rain.jpg';
  const main = day.stops
    .map((s) => placeOf(s.placeId))
    .filter((p): p is Place => !!p)
    .sort((a, b) => b.duration - a.duration)[0];
  // 음식점은 세부 분류에 맞춘 장소 이미지를 그대로 써요
  if (main?.category === 'food') return main.image;
  return main ? CATEGORY_ICON[main.category] : CATEGORY_ICON.culture;
};

export function summarizeDays(it: Itinerary, placeOf: PlaceOf): DaySummary[] {
  const limit = dailyBudget(it);
  return it.days.map((day, index) => {
    const names = day.stops.map((s) => placeOf(s.placeId)?.name).filter((n): n is string => !!n);
    const spend = daySpend(day, placeOf);
    return {
      index,
      date: day.date,
      title: day.title,
      route: names.slice(0, 3),
      moreCount: Math.max(0, names.length - 3),
      walkKm: day.legs.filter((l) => l.mode === 'walk').reduce((s, l) => s + l.km, 0),
      spend,
      over: Math.max(0, spend - limit),
      image: dayImage(day, placeOf),
    };
  });
}

/** 1인 경비를 숙박·식비·입장·쇼핑·교통으로 나눠요 */
export function summarizeBudget(it: Itinerary, placeOf: PlaceOf): BudgetSlice[] {
  const sums: Record<BudgetKey, number> = { lodging: it.lodgingPerPerson, food: 0, entry: 0, shopping: 0, transport: 0 };
  for (const day of it.days) {
    for (const s of day.stops) {
      const p = placeOf(s.placeId);
      if (p) sums[BUDGET_GROUP[p.category]] += p.cost;
    }
    for (const l of day.legs) sums.transport += l.cost;
  }
  const slices: BudgetSlice[] = [
    { key: 'lodging', label: '숙박', value: sums.lodging, colorVar: '--primary-500' },
    { key: 'food', label: '식비', value: sums.food, colorVar: '--coral-500' },
    { key: 'entry', label: '입장·체험', value: sums.entry, colorVar: '--color-category-culture' },
    { key: 'shopping', label: '쇼핑', value: sums.shopping, colorVar: '--color-category-shopping' },
    { key: 'transport', label: '교통', value: sums.transport, colorVar: '--sky-300' },
  ];
  return slices.filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
}

/** 평균 최고기온으로 옷차림 한 줄 + 비 오는 요일 */
export function outfitTip(days: DayPlan[]) {
  const avgHigh = days.reduce((s, d) => s + d.forecast.high, 0) / Math.max(1, days.length);
  const base =
    avgHigh >= 27 ? '가볍고 통풍 잘 되는 옷이 좋아요'
      : avgHigh >= 20 ? '반팔에 얇은 겉옷 하나면 충분해요'
        : avgHigh >= 14 ? '낮엔 얇은 니트, 저녁엔 가벼운 겉옷이 좋아요'
          : avgHigh >= 8 ? '코트나 경량 패딩을 챙기세요'
            : '두꺼운 패딩과 목도리가 꼭 필요해요';
  const rainy = days.filter(isRainyDay).map((d) => `${weekday(d.date)}요일`);
  return rainy.length ? `${base}. ${rainy.join('·')}엔 우산 챙기기!` : base;
}

/** 예상 경비와 예산을 비교한 한 줄 — 실제 지출이 아니라 일정으로 추정한 값이에요 */
export function budgetNote(total: number, limit: number, slices: BudgetSlice[]) {
  const diff = limit - total;
  const man = (Math.abs(diff) / 10_000).toFixed(1);
  if (diff >= 0) {
    return diff >= limit * 0.1
      ? `예산보다 ${man}만원 여유 있어요 · 쇼핑이나 체험을 더 넣어도 괜찮아요`
      : `예산에 딱 맞는 일정이에요 · 여유 ${man}만원`;
  }
  const biggest = slices.find((s) => s.key !== 'lodging');
  return `예산보다 ${man}만원 더 들 것 같아요${biggest ? ` · ${withEul(biggest.label)} 조금 줄이면 맞출 수 있어요` : ''}`;
}
