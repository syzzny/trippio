import { getJSON } from './http';
import { getMockPlaces, placeIcon, setLivePlaces } from '@/data/places';
import type { Destination } from '@/types/trip';
import type { Place } from '@/types/itinerary';
import type { PlacesResponse } from '../../server/places';

export interface PlacesResult {
  places: Place[];
  /** foursquare: 실제 장소 / mock: 키가 없거나 실패해서 목업 사용 */
  source: 'foursquare' | 'mock';
  /** AI가 이름·추천 순서를 다듬었는지 */
  refined: boolean;
}

/** 실제 장소가 이보다 적으면 일정을 짜기 어려워서 목업을 써요 */
const MIN_PLACES = 12;

export async function fetchPlaces(dest: Destination, signal?: AbortSignal): Promise<PlacesResult> {
  try {
    const data = await getJSON<PlacesResponse>(`/api/places?lat=${dest.lat}&lng=${dest.lng}&name=${encodeURIComponent(dest.name)}`, signal);
    if (data.places.length >= MIN_PLACES) {
      const places: Place[] = data.places.map((p) => ({ ...p, destinationId: dest.id, image: placeIcon(p) }));
      setLivePlaces(dest.id, places);
      return { places, source: 'foursquare', refined: data.refined };
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
  }
  return { places: getMockPlaces(dest.id), source: 'mock', refined: false };
}
