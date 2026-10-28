import { useMemo } from 'react';
import { getMockPlaces, getPlaces } from '@/data/places';
import type { Place } from '@/types/itinerary';

/** 장소 id → Place. 실제 데이터와 목업을 함께 찾아 예전 일정도 깨지지 않게 해요 */
export const usePlaceLookup = (destinationId: string | undefined) =>
  useMemo(() => {
    const map = new Map<string, Place>();
    if (destinationId) {
      for (const p of getMockPlaces(destinationId)) map.set(p.id, p);
      for (const p of getPlaces(destinationId)) map.set(p.id, p);
    }
    return (id: string) => map.get(id) ?? null;
  }, [destinationId]);
