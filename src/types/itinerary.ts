import type { TravelStyle } from './trip';

export type PlaceCategory = TravelStyle; // food · nature · culture · cafe · shopping · activity

export interface Place {
  id: string;
  destinationId: string;
  name: string;
  category: PlaceCategory;
  area: string;
  lat: number;
  lng: number;
  /** 머무는 시간(분) */
  duration: number;
  /** 1인 예상 비용(원) */
  cost: number;
  indoor: boolean;
  /** 하루를 통째로 쓰는 장소 (테마파크 등) */
  fullDay?: boolean;
  popularity: number;
  image: string;
  description: string;
  hours: string;
  access: string;
  tags: string[];
  menu?: { name: string; price: string; image: string }[];
}

export type TransportMode = 'walk' | 'transit';

export interface Leg {
  mode: TransportMode;
  minutes: number;
  km: number;
  cost: number;
}

export interface Stop {
  /** 같은 장소를 두 번 넣어도 구분되도록 별도 id */
  id: string;
  placeId: string;
  start: string; // 'HH:mm'
  end: string;
  /** AI가 이 장소를 고른 이유 */
  reasons: string[];
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  title: string;
  /** 일정 시작 시각 — 도착일은 오후부터 */
  startTime: string;
  rainy: boolean;
  forecast: { high: number; low: number; rainChance: number };
  stops: Stop[];
  /** stops[i] → stops[i+1] 이동 구간 (길이 = stops.length - 1) */
  legs: Leg[];
}

export interface Itinerary {
  id: string;
  destinationId: string;
  createdAt: string;
  days: DayPlan[];
  /** 1인 숙박 예상 비용(원) — 일자별 지출과 별도 */
  lodgingPerPerson: number;
  budget: [number, number];
  request: string;
  styles: TravelStyle[];
  /** 인원 — 저장한 여행을 다시 열 때 필요해요 */
  adults?: number;
  children?: number;
}

export type GenerationStep = 'weather' | 'places' | 'route' | 'budget';
