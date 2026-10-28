import { useSyncExternalStore } from 'react';
import { getPlaces } from '@/data/places';
import type { Itinerary, Place } from '@/types/itinerary';

/**
 * 저장한 여행 — 이 브라우저(localStorage)에 보관해요.
 * 로그인·서버 저장을 붙일 때는 이 모듈의 read/write만 API 호출로 바꾸면 돼요.
 */
export interface SavedTrip {
  id: string;
  itinerary: Itinerary;
  /** 실제 API로 받은 장소 — 탭을 닫았다가 다시 열어도 일정을 그대로 보여주려고 함께 저장해요 */
  places: Place[];
  savedAt: string;
  updatedAt: string;
}

const KEY = 'trippio:trips';
const listeners = new Set<() => void>();
let cache: SavedTrip[] | null = null;

const read = (): SavedTrip[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: SavedTrip[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // 같은 여행지·날짜가 여러 장이면 가장 최근에 고친 것만 남겨요 (예전 버전에서 생긴 중복 정리)
    const seen = new Set<string>();
    return [...parsed]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .filter((t) => {
        const key = `${t.itinerary.destinationId}|${t.itinerary.days[0]?.date}|${t.itinerary.days[t.itinerary.days.length - 1]?.date}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  } catch {
    return [];
  }
};

const write = (trips: SavedTrip[]) => {
  cache = trips;
  try {
    localStorage.setItem(KEY, JSON.stringify(trips));
  } catch {
    /* 저장 공간이 없거나 막힌 환경 — 이번 방문 동안은 화면 상태로 유지 */
  }
  listeners.forEach((l) => l());
};

const getSnapshot = () => (cache ??= read());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  // 다른 탭에서 바꾼 내용도 반영
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = read();
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
};

const tripStart = (it: Itinerary) => it.days[0]?.date ?? '';
const tripEnd = (it: Itinerary) => it.days[it.days.length - 1]?.date ?? '';

/** 같은 여행지·같은 날짜로 다시 만든 일정이면 같은 여행으로 봐요 (다시 만들기·AI 수정 요청) */
const sameTrip = (a: Itinerary, b: Itinerary) =>
  a.destinationId === b.destinationId && tripStart(a) === tripStart(b) && tripEnd(a) === tripEnd(b);

export const tripsStore = {
  has: (id: string) => getSnapshot().some((t) => t.id === id),
  /** 일정을 저장하거나 갱신해요. previous가 같은 여행이면 그 자리를 새 일정으로 바꿔요 */
  upsert(itinerary: Itinerary, _previous?: Itinerary | null) {
    const now = new Date().toISOString();
    const trips = getSnapshot();
    // 같은 여행지·같은 날짜의 여행이 이미 있으면 새 일정으로 바꿔요 (다시 만들기·다른 탭에서 만든 일정도 한 장으로)
    const isReplaced = (t: SavedTrip) => t.id !== itinerary.id && sameTrip(t.itinerary, itinerary);
    const existing = trips.find((t) => t.id === itinerary.id) ?? trips.find(isReplaced);
    const places = getPlaces(itinerary.destinationId).filter((p) => p.id.startsWith('fsq:'));
    const next: SavedTrip = {
      id: itinerary.id,
      itinerary,
      places: places.length ? places : existing?.places ?? [],
      savedAt: existing?.savedAt ?? now,
      updatedAt: now,
    };
    write([next, ...trips.filter((t) => t.id !== itinerary.id && !isReplaced(t))]);
  },
  remove(id: string) {
    const trips = getSnapshot();
    const removed = trips.find((t) => t.id === id) ?? null;
    write(trips.filter((t) => t.id !== id));
    return removed;
  },
  restore(trip: SavedTrip) {
    write([trip, ...getSnapshot().filter((t) => t.id !== trip.id)]);
  },
};

export const useTrips = () => useSyncExternalStore(subscribe, getSnapshot, () => []);

export { tripStart, tripEnd };
