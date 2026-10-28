export type Region = 'overseas' | 'domestic';

export type DestinationTheme = 'resort' | 'food' | 'city' | 'nature';

export type TravelStyle = 'food' | 'nature' | 'culture' | 'cafe' | 'shopping' | 'activity';

export interface Destination {
  id: string;
  name: string;
  nameEn: string;
  country: string;
  countryKo: string;
  region: Region;
  lat: number;
  lng: number;
  /** 지도 뷰포트에서 리스트 노출 순서 등에 쓰는 인기도 */
  popularity: number;
  themes: DestinationTheme[];
  tagline: string;
  description: string;
  flightTime: string | null;
  recommendedStay: string;
  currency: 'KRW' | 'JPY' | 'THB' | 'VND' | 'TWD' | 'SGD' | 'IDR' | 'USD' | 'AUD';
  /** 11월 평년 기온 — 16일 이후 일정은 예보 대신 이 값을 써요 */
  climate: { high: number; low: number; rainChance: number };
  image: string;
  placeCount: number;
}

export interface TripDraft {
  destinationId: string | null;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  budget: [number, number];
  styles: TravelStyle[];
  request: string;
}

export interface DailyForecast {
  date: string;
  high: number;
  low: number;
  rainChance: number;
  source: 'forecast' | 'climate';
}
