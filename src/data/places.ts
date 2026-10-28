import type { Place, PlaceCategory } from '@/types/itinerary';
import { DESTINATIONS } from './destinations';

/** 카테고리별 3D 아이콘 — 실제 장소 데이터에는 사진 대신 이 이미지를 써요 */
export const CATEGORY_ICON: Record<PlaceCategory, string> = {
  food: '/images/3d-food.jpg',
  nature: '/images/3d-nature.jpg',
  culture: '/images/3d-culture.jpg',
  cafe: '/images/3d-cafe.jpg',
  shopping: '/images/3d-shopping.jpg',
  activity: '/images/3d-activity.jpg',
};

/**
 * 음식점은 세부 분류(태그)를 보고 어울리는 3D 아이콘을 골라요.
 * 모든 식당에 라멘 그릇이 나오지 않도록, 맞는 게 없으면 접시·포크 아이콘을 써요.
 */
const FOOD_ICONS: { pattern: RegExp; image: string }[] = [
  { pattern: /타코야키|takoyaki/i, image: '/images/3d-takoyaki.jpg' },
  { pattern: /오코노미야키|okonomiyaki|철판|teppan/i, image: '/images/3d-okonomiyaki.jpg' },
  { pattern: /라면|라멘|우동|소바|국수|쌀국수|ramen|udon|soba|noodle|pho|팟타이/i, image: '/images/3d-food.jpg' },
  { pattern: /스시|초밥|사시미|해산물|sushi|sashimi|seafood/i, image: '/images/3d-food-sushi.jpg' },
  { pattern: /피자|파스타|이탈리|양식|프랑스|비스트로|pizza|pasta|italian|french|bistro/i, image: '/images/3d-food-pasta.jpg' },
  { pattern: /바비큐|야키니쿠|고기|스테이크|꼬치|야키토리|징기스칸|bbq|barbecue|grill|steak|yakiniku|yakitori/i, image: '/images/3d-food-bbq.jpg' },
  { pattern: /딤섬|만두|중식|중국|태국|베트남|dim ?sum|dumpling|chinese|thai|vietnam/i, image: '/images/3d-food-dumpling.jpg' },
  { pattern: /덮밥|돈부리|정식|카레|돈카츠|돈가스|가츠|한식|한국 음식|한국식|비빔밥|불고기|일본 음식|밥|donburi|curry|katsu|tonkatsu|korean|japanese|rice/i, image: '/images/3d-food-rice.jpg' },
];

export const foodIcon = (hints: string[]) => {
  const text = hints.join(' ');
  return FOOD_ICONS.find((f) => f.pattern.test(text))?.image ?? '/images/3d-food-dining.jpg';
};

/** 장소에 맞는 3D 아이콘 — 음식점만 세부 분류로 나눠요 */
export const placeIcon = (p: Pick<Place, 'category' | 'tags' | 'description'>) =>
  p.category === 'food' ? foodIcon([...p.tags, p.description]) : CATEGORY_ICON[p.category];

type Seed = Omit<Place, 'destinationId' | 'image'> & { image?: string };

/** 오사카 목업 장소 — 좌표·운영시간은 실제 값을 참고했어요 (이후 Places API로 교체) */
const OSAKA: Seed[] = [
  { id: 'osaka-castle', name: '오사카성 공원', category: 'culture', area: '오사카성', lat: 34.6873, lng: 135.5262, duration: 90, cost: 6000, indoor: false, popularity: 98,
    image: '/images/place-osaka-castle.jpg', description: '도요토미 히데요시가 세운 성과 넓은 공원. 천수각 전망대에서 오사카 시내가 한눈에 보여요.', hours: '09:00 – 17:00', access: '다니마치욘초메역 도보 10분', tags: ['역사', '전망', '산책'] },
  { id: 'kuromon', name: '구로몬 시장', category: 'food', area: '미나미', lat: 34.6655, lng: 135.5062, duration: 60, cost: 20000, indoor: true, popularity: 92,
    image: '/images/place-kuromon.jpg', description: '‘오사카의 부엌’이라 불리는 전통 시장. 신선한 해산물과 와규 꼬치를 걸으며 맛볼 수 있어요.', hours: '09:00 – 18:00', access: '닛폰바시역 도보 3분', tags: ['해산물', '현지시장', '점심'],
    menu: [{ name: '타코야키', price: '¥600', image: '/images/3d-takoyaki.jpg' }, { name: '해산물 덮밥', price: '¥1,500', image: '/images/3d-food-sushi.jpg' }, { name: '와규 꼬치', price: '¥1,000', image: '/images/3d-okonomiyaki.jpg' }] },
  { id: 'dotonbori', name: '도톤보리', category: 'food', area: '미나미', lat: 34.6687, lng: 135.5013, duration: 90, cost: 15000, indoor: false, popularity: 99,
    image: '/images/place-dotonbori.jpg', description: '글리코 간판과 운하가 있는 오사카 대표 먹자거리. 타코야키와 쿠시카츠를 꼭 맛보세요.', hours: '상시 개방', access: '난바역 도보 5분', tags: ['길거리음식', '야경', '랜드마크'],
    menu: [{ name: '타코야키', price: '¥600', image: '/images/3d-takoyaki.jpg' }, { name: '오코노미야키', price: '¥1,200', image: '/images/3d-okonomiyaki.jpg' }] },
  { id: 'horie-cafe', name: '호리에 로컬 카페', category: 'cafe', area: '미나미', lat: 34.6735, lng: 135.4955, duration: 50, cost: 8000, indoor: true, popularity: 70,
    image: '/images/place-horie-cafe.jpg', description: '편집숍과 로스터리가 모인 호리에 골목의 작은 카페. 핸드드립과 디저트가 인기예요.', hours: '10:00 – 19:00', access: '요츠바시역 도보 5분', tags: ['핸드드립', '디저트', '골목'] },
  { id: 'shinsekai', name: '신세카이 · 츠텐카쿠', category: 'culture', area: '텐노지', lat: 34.6525, lng: 135.5063, duration: 100, cost: 9000, indoor: false, popularity: 88,
    image: '/images/place-shinsekai.jpg', description: '레트로한 간판이 가득한 거리와 오사카의 상징 츠텐카쿠 전망대.', hours: '10:00 – 20:00', access: '에비스초역 도보 3분', tags: ['레트로', '전망대', '쿠시카츠'] },
  { id: 'usj', name: '유니버설 스튜디오 재팬', category: 'activity', area: '베이 에어리어', lat: 34.6654, lng: 135.4323, duration: 480, cost: 96000, indoor: false, fullDay: true, popularity: 97,
    description: '닌텐도 월드와 해리포터 구역이 있는 테마파크. 하루를 통째로 잡는 걸 추천해요.', hours: '08:30 – 21:00', access: '유니버설시티역 도보 3분', tags: ['테마파크', '하루 일정', '사전예매'] },
  { id: 'umeda-sky', name: '우메다 스카이 빌딩 공중정원', category: 'culture', area: '우메다', lat: 34.7053, lng: 135.4906, duration: 60, cost: 18000, indoor: true, popularity: 85,
    description: '두 빌딩을 잇는 원형 전망대. 해 질 무렵 방문하면 야경까지 볼 수 있어요.', hours: '09:30 – 22:30', access: '우메다역 도보 9분', tags: ['전망대', '야경', '실내'] },
  { id: 'grand-front', name: '그랜드 프런트 오사카', category: 'shopping', area: '우메다', lat: 34.7046, lng: 135.4945, duration: 90, cost: 30000, indoor: true, popularity: 78,
    description: '오사카역과 바로 연결된 대형 쇼핑몰. 비 오는 날 일정으로 좋아요.', hours: '10:00 – 21:00', access: '오사카역 직결', tags: ['쇼핑몰', '역 직결', '실내'] },
  { id: 'shinsaibashi', name: '신사이바시스지 상점가', category: 'shopping', area: '미나미', lat: 34.6747, lng: 135.5014, duration: 90, cost: 34000, indoor: true, popularity: 90,
    description: '지붕이 덮인 600m 길이의 쇼핑 거리. 드럭스토어와 돈키호테가 모여 있어요.', hours: '11:00 – 21:00', access: '신사이바시역 바로 앞', tags: ['드럭스토어', '아케이드', '실내'] },
  { id: 'namba-parks', name: '난바 파크스', category: 'shopping', area: '미나미', lat: 34.6617, lng: 135.5017, duration: 60, cost: 20000, indoor: true, popularity: 72,
    description: '옥상 정원이 있는 계단식 쇼핑몰. 쇼핑과 가벼운 산책을 함께 할 수 있어요.', hours: '11:00 – 21:00', access: '난바역 도보 3분', tags: ['쇼핑몰', '옥상정원'] },
  { id: 'nakazakicho', name: '나카자키초 카페 거리', category: 'cafe', area: '우메다', lat: 34.7085, lng: 135.503, duration: 60, cost: 9000, indoor: true, popularity: 74,
    description: '오래된 목조 주택을 고친 카페와 소품숍이 모인 골목.', hours: '11:00 – 18:00', access: '나카자키초역 도보 2분', tags: ['카페', '골목', '소품숍'] },
  { id: 'utsubo-park', name: '우츠보 공원', category: 'nature', area: '미나미', lat: 34.6866, lng: 135.492, duration: 40, cost: 0, indoor: false, popularity: 60,
    description: '도심 속 장미 정원과 느티나무 길이 있는 산책 공원.', hours: '상시 개방', access: '혼마치역 도보 5분', tags: ['산책', '정원', '무료'] },
  { id: 'nakanoshima', name: '나카노시마 공원', category: 'nature', area: '기타하마', lat: 34.6925, lng: 135.509, duration: 50, cost: 0, indoor: false, popularity: 68,
    description: '두 강 사이 섬에 있는 강변 공원. 근대 건축물과 함께 걷기 좋아요.', hours: '상시 개방', access: '기타하마역 도보 3분', tags: ['강변', '산책', '건축'] },
  { id: 'tennoji-park', name: '텐노지 공원', category: 'nature', area: '텐노지', lat: 34.651, lng: 135.511, duration: 50, cost: 2000, indoor: false, popularity: 62,
    description: '잔디 광장과 일본 정원이 있는 공원. 아베노 하루카스가 바로 옆이에요.', hours: '07:00 – 22:00', access: '텐노지역 도보 5분', tags: ['정원', '잔디', '산책'] },
  { id: 'shitennoji', name: '시텐노지', category: 'culture', area: '텐노지', lat: 34.6536, lng: 135.5164, duration: 50, cost: 3000, indoor: false, popularity: 66,
    description: '593년에 세워진 일본 최초의 관사 사찰. 오층탑이 아름다워요.', hours: '08:30 – 16:30', access: '시텐노지마에역 도보 5분', tags: ['사찰', '역사'] },
  { id: 'kaiyukan', name: '오사카 해유관', category: 'activity', area: '베이 에어리어', lat: 34.6545, lng: 135.429, duration: 120, cost: 27000, indoor: true, popularity: 86,
    description: '고래상어를 볼 수 있는 대형 수족관. 비 오는 날에도 좋아요.', hours: '10:00 – 20:00', access: '오사카코역 도보 5분', tags: ['수족관', '실내', '가족'] },
  { id: 'tempozan', name: '덴포잔 대관람차', category: 'activity', area: '베이 에어리어', lat: 34.6564, lng: 135.4307, duration: 30, cost: 8000, indoor: false, popularity: 64,
    description: '오사카만과 시내를 내려다보는 대관람차. 해 질 녘이 가장 예뻐요.', hours: '10:00 – 21:30', access: '오사카코역 도보 5분', tags: ['관람차', '노을'] },
  { id: 'harukas', name: '아베노 하루카스 300', category: 'culture', area: '텐노지', lat: 34.6459, lng: 135.5135, duration: 60, cost: 18000, indoor: true, popularity: 76,
    description: '높이 300m 빌딩 꼭대기의 전망대. 날씨가 맑으면 교토까지 보여요.', hours: '09:00 – 22:00', access: '텐노지역 직결', tags: ['전망대', '실내'] },
  { id: 'housing-museum', name: '오사카 주택박물관', category: 'culture', area: '우메다', lat: 34.7111, lng: 135.5112, duration: 70, cost: 6000, indoor: true, popularity: 70,
    description: '에도 시대 거리를 실내에 재현한 박물관. 기모노 체험도 할 수 있어요.', hours: '10:00 – 17:00', access: '덴진바시스지로쿠초메역 직결', tags: ['실내', '체험', '역사'] },
  { id: 'ichiran', name: '이치란 라멘 도톤보리점', category: 'food', area: '미나미', lat: 34.6686, lng: 135.5028, duration: 50, cost: 12000, indoor: true, popularity: 82,
    description: '1인 칸막이 좌석에서 즐기는 돈코츠 라멘. 늦은 시간까지 영업해요.', hours: '24시간', access: '난바역 도보 5분', tags: ['라멘', '혼밥'],
    menu: [{ name: '돈코츠 라멘', price: '¥980', image: '/images/3d-food.jpg' }] },
  { id: 'umeda-okonomi', name: '우메다 오코노미야키 골목', category: 'food', area: '우메다', lat: 34.702, lng: 135.498, duration: 60, cost: 13000, indoor: true, popularity: 75,
    description: '현지 직장인이 찾는 철판 요리집이 모인 지하 골목.', hours: '11:00 – 22:00', access: '우메다역 도보 3분', tags: ['오코노미야키', '현지맛집'],
    menu: [{ name: '오코노미야키', price: '¥1,200', image: '/images/3d-okonomiyaki.jpg' }] },
  { id: 'kushikatsu', name: '쿠시카츠 다루마 신세카이', category: 'food', area: '텐노지', lat: 34.6519, lng: 135.506, duration: 50, cost: 14000, indoor: true, popularity: 80,
    description: '신세카이 원조 쿠시카츠집. 소스는 한 번만 찍는 게 규칙이에요.', hours: '11:00 – 22:30', access: '에비스초역 도보 5분', tags: ['쿠시카츠', '원조'] },
  { id: 'rikuro', name: '리쿠로 오지상 치즈케이크', category: 'cafe', area: '미나미', lat: 34.6658, lng: 135.5014, duration: 20, cost: 9000, indoor: true, popularity: 73,
    description: '갓 구운 수플레 치즈케이크로 유명한 디저트 가게.', hours: '09:00 – 20:00', access: '난바역 도보 2분', tags: ['디저트', '테이크아웃'] },
  { id: 'acchichi', name: '앗치치혼포 타코야키', category: 'food', area: '미나미', lat: 34.6694, lng: 135.5009, duration: 30, cost: 6000, indoor: false, popularity: 79,
    description: '도톤보리 다리 옆에서 줄 서서 먹는 겉바속촉 타코야키.', hours: '09:00 – 01:00', access: '난바역 도보 5분', tags: ['타코야키', '간식'],
    menu: [{ name: '타코야키 8개', price: '¥600', image: '/images/3d-takoyaki.jpg' }] },
  { id: 'yakiniku-namba', name: '난바 와규 야키니쿠', category: 'food', area: '미나미', lat: 34.6649, lng: 135.5003, duration: 80, cost: 38000, indoor: true, popularity: 77,
    description: '현지인이 줄 서는 와규 야키니쿠 식당. 저녁에는 예약을 추천해요.', hours: '17:00 – 23:00', access: '난바역 도보 3분', tags: ['와규', '저녁', '예약 추천'] },
  { id: 'miraiza', name: '미라이자 오사카성 레스토랑', category: 'food', area: '오사카성', lat: 34.6868, lng: 135.5248, duration: 60, cost: 16000, indoor: true, popularity: 65,
    description: '오사카성 공원 안 옛 군 청사를 고친 건물의 레스토랑 · 카페.', hours: '10:00 – 20:00', access: '오사카성 공원 내', tags: ['점심', '근대건축'] },
  { id: 'tempozan-market', name: '텐포잔 마켓플레이스 푸드코트', category: 'food', area: '베이 에어리어', lat: 34.6561, lng: 135.4302, duration: 50, cost: 12000, indoor: true, popularity: 60,
    description: '해유관 바로 옆 쇼핑몰의 푸드코트. 라멘·오므라이스 등 메뉴가 다양해요.', hours: '11:00 – 20:00', access: '오사카코역 도보 5분', tags: ['푸드코트', '실내'] },
  { id: 'tenjinbashi', name: '텐진바시스지 상점가 먹거리', category: 'food', area: '우메다', lat: 34.7038, lng: 135.5118, duration: 60, cost: 11000, indoor: true, popularity: 67,
    description: '일본에서 가장 긴 상점가. 고로케와 스시 같은 동네 먹거리가 많아요.', hours: '10:00 – 20:00', access: '텐진바시스지로쿠초메역 바로 앞', tags: ['상점가', '현지맛집'] },
  { id: 'universal-citywalk', name: '유니버설 시티워크 식당가', category: 'food', area: '베이 에어리어', lat: 34.6672, lng: 135.4353, duration: 60, cost: 16000, indoor: true, popularity: 63,
    description: '테마파크 입구 앞 식당가. 파크에서 나와 바로 저녁을 먹기 좋아요.', hours: '11:00 – 22:00', access: '유니버설시티역 도보 1분', tags: ['저녁', '실내'] },
  { id: 'minoo', name: '미노오 폭포', category: 'nature', area: '미노오', lat: 34.854, lng: 135.4717, duration: 150, cost: 3000, indoor: false, popularity: 58,
    description: '도심에서 40분 거리의 계곡 폭포. 11월에는 단풍이 절정이에요.', hours: '상시 개방', access: '미노오역 도보 40분', tags: ['단풍', '하이킹'] },
  { id: 'river-cruise', name: '도톤보리 리버 크루즈', category: 'activity', area: '미나미', lat: 34.6689, lng: 135.5019, duration: 30, cost: 10000, indoor: false, popularity: 69,
    description: '도톤보리 운하를 따라 20분간 도는 유람선.', hours: '11:00 – 21:00', access: '난바역 도보 5분', tags: ['유람선', '야경'] },
];

/** 다른 여행지는 아직 목업 데이터가 없어서, 도시 중심 기준으로 대표 장소 유형을 만들어 둬요 */
const GENERIC: { suffix: string; category: PlaceCategory; dLat: number; dLng: number; duration: number; cost: number; indoor: boolean; area: string }[] = [
  { suffix: '구시가지 산책', category: 'culture', dLat: 0.006, dLng: -0.004, duration: 90, cost: 0, indoor: false, area: '구시가지' },
  { suffix: '대표 시장', category: 'food', dLat: -0.004, dLng: 0.003, duration: 60, cost: 18000, indoor: true, area: '중심가' },
  { suffix: '로컬 맛집 골목', category: 'food', dLat: 0.002, dLng: 0.008, duration: 60, cost: 15000, indoor: true, area: '중심가' },
  { suffix: '전망대', category: 'culture', dLat: 0.01, dLng: 0.006, duration: 60, cost: 15000, indoor: true, area: '신시가지' },
  { suffix: '시립 미술관', category: 'culture', dLat: -0.008, dLng: -0.006, duration: 80, cost: 10000, indoor: true, area: '문화지구' },
  { suffix: '중앙 공원', category: 'nature', dLat: 0.012, dLng: -0.01, duration: 50, cost: 0, indoor: false, area: '신시가지' },
  { suffix: '해변 산책로', category: 'nature', dLat: -0.015, dLng: 0.014, duration: 70, cost: 0, indoor: false, area: '해안' },
  { suffix: '로스터리 카페', category: 'cafe', dLat: 0.004, dLng: -0.009, duration: 50, cost: 8000, indoor: true, area: '구시가지' },
  { suffix: '디저트 카페', category: 'cafe', dLat: -0.002, dLng: 0.011, duration: 40, cost: 9000, indoor: true, area: '중심가' },
  { suffix: '쇼핑 거리', category: 'shopping', dLat: -0.006, dLng: 0.006, duration: 90, cost: 30000, indoor: true, area: '중심가' },
  { suffix: '야시장', category: 'food', dLat: -0.01, dLng: -0.002, duration: 80, cost: 16000, indoor: false, area: '문화지구' },
  { suffix: '시티 투어 체험', category: 'activity', dLat: 0.008, dLng: 0.012, duration: 120, cost: 35000, indoor: false, area: '신시가지' },
];

const genericFor = (destId: string): Seed[] => {
  const d = DESTINATIONS.find((x) => x.id === destId);
  if (!d) return [];
  return GENERIC.map((g, i) => ({
    id: `${destId}-${i}`,
    name: `${d.name} ${g.suffix}`,
    category: g.category,
    area: g.area,
    lat: d.lat + g.dLat * 3,
    lng: d.lng + g.dLng * 3,
    duration: g.duration,
    cost: g.cost,
    indoor: g.indoor,
    popularity: 80 - i * 2,
    description: `${d.name}에서 많이 찾는 ${g.suffix}. 실제 장소 데이터는 Places API 연동 후 채워져요.`,
    hours: '09:00 – 20:00',
    access: '도심에서 대중교통 이용',
    tags: [g.area],
  }));
};

const withImage = (destId: string) => (s: Seed): Place => ({ ...s, destinationId: destId, image: s.image ?? placeIcon(s) });

/** 목업 장소 — API를 못 쓰는 환경(키 없음·오류)에서 대신 써요 */
export const getMockPlaces = (destinationId: string): Place[] =>
  destinationId === 'osaka' ? OSAKA.map(withImage('osaka')) : genericFor(destinationId).map(withImage(destinationId));

// ── 실제 API(Foursquare)에서 받은 장소 ──
// 일정은 장소 id만 저장하므로, 새로고침 후에도 찾을 수 있게 이 탭(sessionStorage)에 함께 보관해요.
const live = new Map<string, Place[]>();
const liveKey = (destinationId: string) => `trippio:places:${destinationId}`;

export function setLivePlaces(destinationId: string, incoming: Place[]) {
  // 저장한 여행을 열 때 그 여행의 장소가 빠지지 않도록, 기존 목록과 합쳐요 (같은 id는 새 값으로)
  const ids = new Set(incoming.map((p) => p.id));
  const places = [...incoming, ...(getLivePlaces(destinationId) ?? []).filter((p) => !ids.has(p.id))];
  live.set(destinationId, places);
  try {
    sessionStorage.setItem(liveKey(destinationId), JSON.stringify(places));
  } catch {
    /* 저장소를 못 쓰면 메모리에만 */
  }
}

const getLivePlaces = (destinationId: string): Place[] | null => {
  const hit = live.get(destinationId);
  if (hit) return hit;
  try {
    const raw = sessionStorage.getItem(liveKey(destinationId));
    if (!raw) return null;
    // 아이콘 규칙이 바뀌어도 예전에 저장한 장소까지 새 아이콘으로 보이게, 읽을 때 다시 골라요
    const parsed = (JSON.parse(raw) as Place[]).map((p) => ({ ...p, image: placeIcon(p) }));
    live.set(destinationId, parsed);
    return parsed;
  } catch {
    return null;
  }
};

/** 일정에 쓸 장소 목록: 실제 데이터가 있으면 그것, 없으면 목업 */
export const getPlaces = (destinationId: string): Place[] => getLivePlaces(destinationId) ?? getMockPlaces(destinationId);

/** id로 장소 찾기 — 예전에 목업으로 만든 일정도 열리도록 두 곳을 모두 찾아요 */
export const getPlace = (destinationId: string, placeId: string) =>
  getLivePlaces(destinationId)?.find((p) => p.id === placeId) ??
  getMockPlaces(destinationId).find((p) => p.id === placeId) ??
  null;

export const CATEGORY_LABEL: Record<PlaceCategory, string> = {
  food: '맛집', nature: '자연', culture: '문화', cafe: '카페', shopping: '쇼핑', activity: '액티비티',
};

export const CATEGORY_COLOR: Record<PlaceCategory, string> = {
  food: 'var(--color-category-food)',
  nature: 'var(--color-category-nature)',
  culture: 'var(--color-category-culture)',
  cafe: 'var(--color-category-cafe)',
  shopping: 'var(--color-category-shopping)',
  activity: 'var(--sky-500)',
};
