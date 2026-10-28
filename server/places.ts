import { refinePlaces } from './ai.js';

/**
 * 장소 검색 프록시 (Foursquare Places API)
 *
 * - Service API Key를 브라우저에 노출하지 않으려고 서버에서만 호출해요.
 * - 무료 구간(Pro 필드)만 쓰도록 fields를 이름·좌표·카테고리·주소로 제한해요.
 *   평점·영업시간·사진은 Premium 필드라 요청하지 않아요.
 * - 같은 여행지는 서버 메모리에 6시간 캐시해 호출 수를 줄여요.
 */

export type TripCategory = 'food' | 'cafe' | 'culture' | 'nature' | 'shopping' | 'activity';

/** 클라이언트 Place 타입과 같은 모양 (destinationId·image는 클라이언트에서 채워요) */
export interface ApiPlace {
  id: string;
  name: string;
  category: TripCategory;
  area: string;
  lat: number;
  lng: number;
  duration: number;
  cost: number;
  indoor: boolean;
  popularity: number;
  description: string;
  hours: string;
  access: string;
  tags: string[];
  fullDay?: boolean;
}

export interface PlacesResponse {
  places: ApiPlace[];
  source: 'foursquare';
  /** AI가 이름·소개·추천 점수를 다듬었는지 */
  refined: boolean;
  /** 같은 명소라 하나로 묶은 장소 수 */
  merged: number;
  /** AI 다듬기에 실패한 이유 (확인용) */
  aiError?: string;
  /** 다듬기에 쓴 AI 모델 */
  aiModel?: string;
  fetchedAt: string;
  /** 스타일별로 받은 장소 수 (확인용) */
  counts: Record<string, number>;
}

interface FsqCategory {
  fsq_category_id?: string;
  name: string;
  short_name?: string;
}

interface FsqPlace {
  fsq_place_id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  categories?: FsqCategory[];
  location?: { locality?: string; region?: string; formatted_address?: string; address?: string };
}

export class PlacesError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const BASE = 'https://places-api.foursquare.com/places/search';
const API_VERSION = '2025-06-17';
const PRO_FIELDS = 'fsq_place_id,name,latitude,longitude,categories,location';
const CACHE_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; data: PlacesResponse }>();

/**
 * 여행 스타일마다 Foursquare 카테고리로 검색해요.
 * (자유 검색어는 관광안내소 같은 엉뚱한 결과가 섞여서 카테고리 ID로 좁혀요)
 */
const SEARCHES: { label: string; category: TripCategory; ids: string[]; limit: number }[] = [
  // Restaurant
  { label: 'food', category: 'food', ids: ['4d4b7105d754a06374d81259'], limit: 25 },
  // Coffee Shop, Café
  { label: 'cafe', category: 'cafe', ids: ['4bf58dd8d48988d1e0931735', '4bf58dd8d48988d16d941735'], limit: 12 },
  // Museum, Historic Site, Monument / Landmark
  { label: 'culture', category: 'culture', ids: ['4bf58dd8d48988d181941735', '4deefb944765f83613cdba6e', '4bf58dd8d48988d12d941735'], limit: 15 },
  // Park, Garden, Scenic Lookout
  { label: 'nature', category: 'nature', ids: ['4bf58dd8d48988d163941735', '4bf58dd8d48988d15a941735', '4bf58dd8d48988d165941735'], limit: 10 },
  // Shopping Mall, Department Store
  { label: 'shopping', category: 'shopping', ids: ['4bf58dd8d48988d1fd941735', '4bf58dd8d48988d1f6941735'], limit: 10 },
  // Theme Park, Aquarium, Zoo
  { label: 'activity', category: 'activity', ids: ['4bf58dd8d48988d182941735', '4fceea171983d5d06c3e9823', '4bf58dd8d48988d17b941735'], limit: 8 },
];

/** API에 없는 값은 카테고리별 기본값으로 채워요 (AI 연동 시 AI가 다듬을 값) */
const DEFAULTS: Record<TripCategory, { duration: number; cost: number; indoor: boolean }> = {
  food: { duration: 70, cost: 15000, indoor: true },
  cafe: { duration: 50, cost: 7000, indoor: true },
  culture: { duration: 90, cost: 8000, indoor: true },
  nature: { duration: 70, cost: 0, indoor: false },
  shopping: { duration: 80, cost: 30000, indoor: true },
  activity: { duration: 120, cost: 30000, indoor: false },
};

const THEME_PARK_ID = '4bf58dd8d48988d182941735';

/** 같은 카테고리에서 이 거리(km) 안의 장소는 하나만 남겨요 (테마파크 속 놀이기구, 성과 천수각 같은 중복) */
const MIN_GAP_KM: Record<TripCategory, number> = {
  food: 0.08, cafe: 0.08, culture: 0.3, nature: 0.4, shopping: 0.2, activity: 1.5,
};

const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const r = Math.PI / 180;
  const x = (b.lng - a.lng) * r * Math.cos(((a.lat + b.lat) / 2) * r);
  const y = (b.lat - a.lat) * r;
  return Math.sqrt(x * x + y * y) * 6371;
};

/** "오사카성 (大阪城)"처럼 괄호로 붙은 현지어 이름은 떼고 보여줘요 */
const cleanName = (name: string) => name.split(/\s*[(（]/)[0].trim() || name;

const OUTDOOR_HINT = /park|garden|beach|shrine|temple|plaza|square|street|market|zoo|harbor|bridge|trail|mountain|view/i;

async function search(key: string, lat: number, lng: number, ids: string[], limit: number): Promise<FsqPlace[]> {
  const params = new URLSearchParams({
    fsq_category_ids: ids.join(','),
    ll: `${lat},${lng}`,
    radius: '10000',
    limit: String(limit),
    fields: PRO_FIELDS,
  });
  const res = await fetch(`${BASE}?${params}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      'X-Places-Api-Version': API_VERSION,
      Accept: 'application/json',
      // 한국어 이름이 등록된 장소는 한국어로 받아요
      'Accept-Language': 'ko',
    },
  });
  if (res.status === 401 || res.status === 403) throw new PlacesError(502, 'Foursquare API 키를 확인해 주세요');
  if (res.status === 429) throw new PlacesError(503, 'Foursquare 호출 한도를 넘었어요');
  if (!res.ok) throw new PlacesError(502, `Foursquare 응답 오류 (${res.status})`);
  const data = (await res.json()) as { results?: FsqPlace[] };
  return data.results ?? [];
}

function toPlace(p: FsqPlace, category: TripCategory, rank: number, total: number): ApiPlace | null {
  if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') return null;
  const catNames = (p.categories ?? []).map((c) => c.short_name || c.name).filter(Boolean);
  const themePark = (p.categories ?? []).some((c) => c.fsq_category_id === THEME_PARK_ID);
  const d = themePark ? { duration: 480, cost: 90000, indoor: false } : DEFAULTS[category];
  const indoor = category === 'nature' || category === 'activity' ? false : !OUTDOOR_HINT.test(catNames.join(' ')) && d.indoor;
  const area = p.location?.locality || p.location?.region || '';
  return {
    id: `fsq:${p.fsq_place_id}`,
    name: cleanName(p.name),
    category,
    ...(themePark ? { fullDay: true } : {}),
    area,
    lat: p.latitude,
    lng: p.longitude,
    duration: d.duration,
    cost: d.cost,
    indoor,
    // 검색 결과 순서(관련도)를 인기도처럼 써요: 앞쪽일수록 높게
    popularity: Math.round(90 - (rank / Math.max(1, total)) * 40),
    description: [catNames[0], area].filter(Boolean).join(' · ') || '현지에서 많이 찾는 장소',
    hours: '영업시간은 방문 전에 확인해 주세요',
    access: p.location?.formatted_address || p.location?.address || area,
    tags: catNames.slice(0, 3),
  };
}

/* ───────── 겹치는 장소 묶기 ───────── */

const SIGHT: TripCategory[] = ['culture', 'nature', 'activity'];

const firstWord = (name: string) => name.replace(/\s+/g, ' ').trim().split(' ')[0];

/** "오사카성 공원"과 "오사카성"처럼 한쪽 이름이 다른 쪽의 핵심 단어를 품고 있는지 */
const sameLandmark = (a: string, b: string) => {
  const na = a.replace(/\s+/g, '');
  const nb = b.replace(/\s+/g, '');
  const fa = firstWord(a);
  const fb = firstWord(b);
  return (fa.length >= 2 && nb.includes(fa)) || (fb.length >= 2 && na.includes(fb));
};

/**
 * 같은 명소를 가리키는 장소를 하나로 묶어요.
 *  1) 테마파크처럼 하루를 다 쓰는 곳 안(1.5km)에 있는 명소는 빼요 (유니버설 글로브 등)
 *  2) 600m 안에서 이름이 겹치면 같은 곳으로 봐요 (오사카성 공원 ↔ 오사카성)
 *  3) 250m 안에 붙어 있는 같은 종류의 명소도 같은 곳으로 봐요 (한 단지 안의 박물관 건물들)
 * 남는 곳은 인기도가 높은 쪽이고, 빠진 이름은 태그로 남겨 상세 화면에서 보이게 해요.
 */
export function mergeOverlaps(places: ApiPlace[]): { places: ApiPlace[]; merged: number } {
  const fullDay = places.filter((p) => p.fullDay);
  const kept: ApiPlace[] = [];
  let merged = 0;
  for (const p of [...places].sort((a, b) => Number(!!b.fullDay) - Number(!!a.fullDay) || b.popularity - a.popularity)) {
    if (!SIGHT.includes(p.category)) {
      kept.push(p);
      continue;
    }
    if (!p.fullDay && fullDay.some((f) => km(f, p) < 1.5)) {
      merged += 1;
      continue;
    }
    const same = kept.find(
      (q) => SIGHT.includes(q.category) && !q.fullDay && ((q.category === p.category && km(q, p) < 0.25) || (km(q, p) < 0.6 && sameLandmark(q.name, p.name))),
    );
    if (same) {
      if (!same.tags.includes(p.name)) same.tags = [...same.tags, p.name].slice(0, 5);
      merged += 1;
      continue;
    }
    kept.push({ ...p });
  }
  return { places: kept, merged };
}

export interface RefineOptions {
  /** Groq API 키 — 없으면 AI 다듬기 없이 원본을 돌려줘요 */
  aiKey?: string;
  aiModel?: string;
  /** 프롬프트에 넣을 여행지 이름 */
  destName?: string;
}

export async function getPlacesNear(
  key: string | undefined,
  lat: number,
  lng: number,
  { aiKey, aiModel, destName = '' }: RefineOptions = {},
): Promise<PlacesResponse> {
  if (!key) throw new PlacesError(503, 'FOURSQUARE_API_KEY가 설정되지 않았어요');
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new PlacesError(400, '좌표가 올바르지 않아요');
  }
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const hit = cache.get(cacheKey);
  // AI 다듬기에 실패한 결과는 10분만 캐시해서 곧 다시 시도해요
  if (hit && Date.now() - hit.at < (hit.data.refined || !aiKey ? CACHE_MS : 10 * 60 * 1000)) return hit.data;

  const batches = await Promise.all(SEARCHES.map((s) => search(key, lat, lng, s.ids, s.limit)));
  const seen = new Set<string>();
  const places: ApiPlace[] = [];
  batches.forEach((results, i) => {
    results
      .map((r, rank) => ({ r, place: toPlace(r, SEARCHES[i].category, rank, results.length) }))
      // 테마파크 본체를 먼저 넣어야 그 안의 놀이기구·구역이 중복으로 빠져요
      .sort((a, b) => Number(!!b.place?.fullDay) - Number(!!a.place?.fullDay))
      .forEach(({ r, place }) => {
        if (!place || seen.has(r.fsq_place_id)) return;
        const gap = MIN_GAP_KM[place.category];
        if (places.some((q) => q.category === place.category && km(q, place) < gap)) return;
        seen.add(r.fsq_place_id);
        places.push(place);
      });
  });

  const counts = Object.fromEntries(SEARCHES.map((s, i) => [s.label, batches[i].length]));
  const ai = await refinePlaces(aiKey, destName, places, aiModel || undefined);
  // 이름이 한국어로 정리된 뒤에 묶어야 "오사카성 공원"과 "오사카성"을 같은 곳으로 알아봐요
  const overlap = mergeOverlaps(ai.places);
  const data: PlacesResponse = {
    places: overlap.places,
    merged: overlap.merged,
    source: 'foursquare',
    refined: ai.refined,
    ...(ai.error ? { aiError: ai.error } : {}),
    ...('model' in ai && ai.model ? { aiModel: ai.model } : {}),
    fetchedAt: new Date().toISOString(),
    counts,
  };
  cache.set(cacheKey, { at: Date.now(), data });
  return data;
}

/** 쿼리 문자열 lat/lng 파싱 */
export const parseLatLng = (url: URL) => ({
  lat: Number(url.searchParams.get('lat')),
  lng: Number(url.searchParams.get('lng')),
  /** 프롬프트용 여행지 이름 — 길이를 제한해 엉뚱한 입력을 막아요 */
  name: (url.searchParams.get('name') ?? '').slice(0, 30),
});
