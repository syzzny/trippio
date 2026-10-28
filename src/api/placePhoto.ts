import { useQuery } from '@tanstack/react-query';
import type { Place } from '@/types/itinerary';

/**
 * 장소 실제 사진 — 위키백과(Wikimedia)에서 무료로 찾아요.
 *
 * 1) 장소 좌표 근처(1km)의 위키백과 문서를 한국어·영어·일본어판에서 찾고
 * 2) 문서 제목이 장소 이름(한국어 이름·원래 이름)과 맞는 것만 골라
 * 3) 그 문서의 대표 사진을 Wikimedia Commons에서 라이선스와 함께 가져와요.
 * Commons에 없는 사진(비자유 이미지)은 쓰지 않아요. 못 찾으면 3D 아이콘을 그대로 써요.
 */

export interface PlacePhoto {
  url: string;
  /** 저작자 (HTML을 걷어 낸 이름) */
  artist: string;
  license: string;
  /** Commons 파일 페이지 — 출처 링크 */
  sourceUrl: string;
}

interface GeoPage {
  title: string;
  pageimage?: string;
  coordinates?: { lat: number; lon: number }[];
}

interface CommonsPage {
  missing?: string;
  imageinfo?: {
    thumburl?: string;
    url: string;
    descriptionurl: string;
    extmetadata?: Record<string, { value: string } | undefined>;
  }[];
}

/** 사진을 찾아볼 장소 — 식당·카페는 위키백과 문서가 거의 없어서 건너뛰어요 */
const LOOKUP_CATEGORIES = new Set(['culture', 'nature', 'activity', 'shopping']);

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\s·・,.'’()\-–_]/g, '');

/**
 * 문서 제목이 장소 이름과 같은 곳을 가리키는지.
 * 제목이 이름을 품거나("오사카성 공원" ⊃ "오사카성"), 이름이 제목을 품되 제목이 이름 길이의 60% 이상일 때만.
 * ("Museum of Oriental Ceramics, Osaka"가 도시 문서 "Osaka"와 맞아 버리는 것을 막아요)
 */
const matches = (title: string, names: string[]) => {
  const t = norm(title.replace(/\s*\(.*\)$/, ''));
  if (t.length < 2) return false;
  return names.some((n) => {
    const m = norm(n);
    if (m.length < 2) return false;
    return t.includes(m) || (m.includes(t) && t.length >= m.length * 0.6);
  });
};

const textOf = (html: string) => {
  try {
    return new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() ?? '';
  } catch {
    return html.replace(/<[^>]+>/g, '').trim();
  }
};

async function nearbyPages(lang: string, place: Place, signal?: AbortSignal): Promise<GeoPage[]> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'geosearch',
    ggscoord: `${place.lat}|${place.lng}`,
    ggsradius: '1000',
    ggslimit: '50',
    prop: 'pageimages|coordinates',
    piprop: 'name',
    format: 'json',
    formatversion: '2',
    origin: '*',
  });
  const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`, { signal });
  if (!res.ok) return [];
  const data = (await res.json()) as { query?: { pages?: GeoPage[] }; error?: { code: string } };
  // 검색이 바쁘다는 응답 등은 "사진 없음"으로 저장하지 않고 다음에 다시 찾도록 에러로 넘겨요
  if (data.error) throw new Error(`Wikipedia: ${data.error.code}`);
  return data.query?.pages ?? [];
}

/** 로고·지도·문장·도면처럼 장소 사진이 아닌 대표 이미지는 건너뛰어요 */
const NOT_A_PHOTO = /\.svg$|logo|map|locator|location|seal|emblem|flag|diagram|plan|sign\b/i;

async function commonsPhoto(fileName: string, signal?: AbortSignal): Promise<PlacePhoto | null> {
  if (NOT_A_PHOTO.test(fileName)) return null;
  const params = new URLSearchParams({
    action: 'query',
    titles: `File:${fileName}`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '800',
    format: 'json',
    formatversion: '2',
    origin: '*',
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { signal });
  if (!res.ok) return null;
  const page = ((await res.json()) as { query?: { pages?: CommonsPage[] } }).query?.pages?.[0];
  const info = page?.imageinfo?.[0];
  if (!page || page.missing !== undefined || !info) return null;
  const meta = info.extmetadata ?? {};
  // 비자유(공정 이용) 이미지는 쓰지 않아요
  if (meta.NonFree?.value === 'true') return null;
  return {
    url: info.thumburl ?? info.url,
    artist: textOf(meta.Artist?.value ?? '') || '작자 미상',
    license: meta.LicenseShortName?.value ?? 'Wikimedia Commons',
    sourceUrl: info.descriptionurl,
  };
}

export async function findPlacePhoto(place: Place, signal?: AbortSignal): Promise<PlacePhoto | null> {
  const names = [place.name, ...place.tags];
  let busy: unknown = null;
  for (const lang of ['ko', 'en', 'ja']) {
    let found: GeoPage[];
    try {
      found = await nearbyPages(lang, place, signal);
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
      busy = e; // 한 언어판이 바쁘면 다른 언어판에서 계속 찾아요
      continue;
    }
    const pages = found.filter((p) => p.pageimage && matches(p.title, names));
    if (pages.length === 0) continue;
    const dist = (p: GeoPage) => {
      const c = p.coordinates?.[0];
      return c ? Math.hypot(c.lat - place.lat, c.lon - place.lng) : 1;
    };
    // 이름이 정확히 같은 문서 → 가까운 문서 순으로, Commons에 있는 사진이 나올 때까지 (최대 3개)
    const exact = (pg: GeoPage) => (norm(pg.title.replace(/\s*\(.*\)$/, '')) === norm(place.name) ? 0 : 1);
    const ranked = pages.sort((a, b) => exact(a) - exact(b) || dist(a) - dist(b)).slice(0, 3);
    for (const pg of ranked) {
      const photo = await commonsPhoto(pg.pageimage!, signal);
      if (photo) return photo;
    }
  }
  // 못 찾았는데 중간에 바쁨 응답이 있었다면, 없음으로 확정하지 않고 나중에 다시 시도해요
  if (busy) throw busy;
  return null;
}

/** 장소 상세에서 쓰는 사진 — 이미 실제 사진이 있거나(목업 장소) 식당·카페면 찾지 않아요 */
export const usePlacePhoto = (place: Place | null) =>
  useQuery({
    queryKey: ['place-photo', place?.id],
    queryFn: ({ signal }) => findPlacePhoto(place!, signal),
    enabled: !!place && place.image.includes('/3d-') && LOOKUP_CATEGORIES.has(place.category),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    retry: 1,
    retryDelay: 3000,
  });
