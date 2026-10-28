import { ApiError } from './http';
import { getPlace, getPlaces } from '@/data/places';
import { formatShort } from '@/lib/date';
import { distanceKm } from '@/lib/geo';
import { buildDay, orderForRoute, readPreferences } from '@/lib/planner';
import type { Itinerary, Place } from '@/types/itinerary';
import type { EditRequest, EditResponse } from '../../server/aiEdit';

export interface AiEditResult {
  itinerary: Itinerary;
  message: string;
  /** 바뀐 날짜의 인덱스 */
  changedDays: number[];
}

const MAX_CANDIDATES = 80;

/**
 * 자유로운 수정 요청을 AI에게 보내고, 돌아온 장소 순서로 일정을 다시 계산해요.
 * 시간표·이동 구간은 planner가 계산하므로 AI는 "어디를 어떤 순서로"만 정해요.
 */
export async function requestAiEdit(it: Itinerary, destName: string, request: string, signal?: AbortSignal): Promise<AiEditResult> {
  const inPlan = new Set(it.days.flatMap((d) => d.stops.map((s) => s.placeId)));
  const current = [...inPlan].map((id) => getPlace(it.destinationId, id)).filter((p): p is Place => !!p);
  // 지금 일정의 장소는 꼭 넣고, 나머지는 인기 순으로 채워요
  const others = getPlaces(it.destinationId)
    .filter((p) => !inPlan.has(p.id))
    .sort((a, b) => b.popularity - a.popularity);
  const candidates = [...current, ...others].slice(0, MAX_CANDIDATES);

  // 날마다 장소들의 중심점을 구해, 후보 장소가 어느 날과 가까운지 알려 줘요
  const centers = it.days.map((d) => {
    const ps = d.stops.map((s) => getPlace(it.destinationId, s.placeId)).filter((p): p is Place => !!p);
    if (ps.length === 0) return null;
    return { lat: ps.reduce((a, p) => a + p.lat, 0) / ps.length, lng: ps.reduce((a, p) => a + p.lng, 0) / ps.length };
  });
  const nearestDay = (p: Place) => {
    let best = -1;
    let bestKm = Infinity;
    centers.forEach((c, i) => {
      if (!c) return;
      const km = distanceKm(c, p);
      if (km < bestKm) {
        bestKm = km;
        best = i;
      }
    });
    return best < 0 ? undefined : `DAY ${best + 1} · ${bestKm.toFixed(1)}km`;
  };

  const body: EditRequest = {
    destName,
    request,
    days: it.days.map((d) => ({
      label: formatShort(d.date),
      rainy: d.rainy,
      high: d.forecast.high,
      stops: d.stops.map((s) => s.placeId),
    })),
    places: candidates.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      indoor: p.indoor,
      fullDay: p.fullDay,
      // 세부 분류 태그 (예: Sushi·일본 음식, 라면, 백화점) — 원래 이름이 섞여 있어도 AI가 구분해요
      kind: p.tags.filter((t) => t !== p.name).slice(0, 3).join('·') || undefined,
      near: nearestDay(p),
    })),
  };

  const res = await fetch('/api/ai-edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  const data = (await res.json().catch(() => ({}))) as Partial<EditResponse> & { message?: string };
  if (!res.ok || !Array.isArray(data.days)) throw new ApiError(res.status, data.message ?? `요청 실패 (${res.status})`);

  const nextRequest = [it.request.trim(), request].filter(Boolean).join(' ').slice(0, 200);
  const timeSpecified = /아침|오전|점심|오후|저녁|밤|마지막|처음|첫\s*번째|먼저|다음에/.test(request);
  const prefs = readPreferences(nextRequest);
  const seen = new Set<string>();
  const changedDays: number[] = [];

  const days = it.days.map((day, i) => {
    // 다른 날에 이미 쓴 장소는 빼요 (AI가 겹치게 답한 경우)
    const ids = (data.days![i] ?? []).filter((id) => !seen.has(id));
    ids.forEach((id) => seen.add(id));
    const same = ids.length === day.stops.length && ids.every((id, k) => id === day.stops[k].placeId);
    if (same || ids.length === 0) return day;
    // AI는 좌표를 모르니, 고른 장소의 순서는 실제 거리로 한 번 더 다듬어요
    const picked = ids.map((id) => getPlace(it.destinationId, id)).filter((p): p is Place => !!p);
    // "오후에", "저녁에"처럼 시간을 콕 집어 말했다면 피오가 정한 순서를 그대로 지켜요
    const places = timeSpecified ? picked : orderForRoute(picked);
    if (places.length === 0) return day;
    changedDays.push(i);
    return buildDay(day, places, { styles: it.styles, prefs, existing: day.stops });
  });

  return {
    itinerary: { ...it, days, request: nextRequest },
    // AI가 남긴 한 줄 (바뀐 게 없을 때는 그 이유가 담겨 와요)
    message: data.message ?? '',
    changedDays,
  };
}
