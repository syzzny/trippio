import { getTravelGuide } from '@/data/travelGuide';
import { getDestination } from '@/data/destinations';
import { weekday } from '@/lib/date';
import type { Itinerary } from '@/types/itinerary';
import { isRainyDay } from './summary';

/** 준비물 목록: 여행지 기본 항목 + 비 오는 날이 있으면 우산을 마지막 항목 앞에 넣어요 */
export function buildChecklist(it: Itinerary): string[] {
  const dest = getDestination(it.destinationId);
  const guide = getTravelGuide(it.destinationId, dest?.region === 'domestic');
  const list = [...guide.checklist];
  const rainy = it.days.filter(isRainyDay);
  if (rainy.length) {
    list.splice(Math.max(0, list.length - 1), 0, `우산 (${rainy.map((d) => weekday(d.date)).join('·')}요일 비)`);
  }
  return list;
}

/** 준비물 체크 저장 키 — 같은 여행지·날짜로 다시 만든 일정도 체크 상태를 이어받아요 */
export const checklistKey = (it: Pick<Itinerary, 'destinationId' | 'days'>) =>
  `trippio:checklist:${it.destinationId}:${it.days[0]?.date ?? ''}:${it.days[it.days.length - 1]?.date ?? ''}`;
