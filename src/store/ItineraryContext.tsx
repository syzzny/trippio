import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Itinerary } from '@/types/itinerary';
import { buildDay, readPreferences } from '@/lib/planner';
import { getPlace } from '@/data/places';
import { tripsStore } from './trips';

const STORAGE_KEY = 'trippio:itinerary';

interface Ctx {
  itinerary: Itinerary | null;
  setItinerary: (it: Itinerary | null) => void;
  moveStop: (day: number, from: number, to: number) => void;
  removeStop: (day: number, stopId: string) => void;
  insertPlace: (day: number, index: number, placeId: string) => void;
  replacePlace: (day: number, stopId: string, placeId: string) => void;
}

const ItineraryContext = createContext<Ctx | null>(null);

const load = (): Itinerary | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Itinerary) : null;
  } catch {
    return null;
  }
};

export function ItineraryProvider({ children }: { children: ReactNode }) {
  const [itinerary, setItinerary] = useState<Itinerary | null>(load);

  // 만든 일정은 '내 여행'에 자동으로 저장하고, 편집할 때마다 갱신해요
  const previous = useRef<Itinerary | null>(itinerary);
  useEffect(() => {
    try {
      if (itinerary) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(itinerary));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    // 처음 열 때 아직 저장되지 않은 일정(이 기능 전에 만든 일정 등)도 저장해요
    if (itinerary && (itinerary !== previous.current || !tripsStore.has(itinerary.id))) {
      tripsStore.upsert(itinerary, previous.current === itinerary ? null : previous.current);
    }
    previous.current = itinerary;
  }, [itinerary]);

  /** 장소 순서가 바뀌면 시간표·이동 구간·이유를 다시 계산해요 (제목은 유지) */
  const rebuild = useCallback((dayIndex: number, transform: (placeIds: string[], stopIds: string[]) => string[]) => {
    setItinerary((it) => {
      if (!it) return it;
      const day = it.days[dayIndex];
      const ids = transform(
        day.stops.map((s) => s.placeId),
        day.stops.map((s) => s.id),
      );
      const places = ids.map((id) => getPlace(it.destinationId, id)).filter((p): p is NonNullable<typeof p> => !!p);
      const next = buildDay(day, places, {
        styles: it.styles,
        prefs: readPreferences(it.request),
        existing: day.stops,
        keepTitle: day.title,
      });
      const days = [...it.days];
      days[dayIndex] = next;
      return { ...it, days };
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      itinerary,
      setItinerary,
      moveStop: (day, from, to) =>
        rebuild(day, (ids) => {
          const arr = [...ids];
          const [m] = arr.splice(from, 1);
          arr.splice(to, 0, m);
          return arr;
        }),
      removeStop: (day, stopId) => rebuild(day, (ids, stopIds) => ids.filter((_, i) => stopIds[i] !== stopId)),
      insertPlace: (day, index, placeId) =>
        rebuild(day, (ids) => {
          const arr = [...ids];
          arr.splice(index, 0, placeId);
          return arr;
        }),
      replacePlace: (day, stopId, placeId) =>
        rebuild(day, (ids, stopIds) => ids.map((id, i) => (stopIds[i] === stopId ? placeId : id))),
    }),
    [itinerary, rebuild],
  );

  return <ItineraryContext.Provider value={value}>{children}</ItineraryContext.Provider>;
}

export const useItinerary = () => {
  const ctx = useContext(ItineraryContext);
  if (!ctx) throw new Error('useItinerary must be used within ItineraryProvider');
  return ctx;
};
