import type { Destination } from '@/types/trip';

// 목업 데이터: 이후 Places API 연동 시 같은 타입으로 교체해요.
export const DESTINATIONS: Destination[] = [
  {
    id: 'osaka', name: '오사카', nameEn: 'OSAKA', country: 'JAPAN', countryKo: '일본', region: 'overseas',
    lat: 34.6937, lng: 135.5023, popularity: 98, themes: ['food', 'city'],
    tagline: '미식 · 쇼핑 · 테마파크', description: '먹거리와 쇼핑, 테마파크까지 즐길 수 있는 간사이 대표 도시',
    flightTime: '1시간 40분', recommendedStay: '3박 4일', currency: 'JPY',
    climate: { high: 17, low: 10, rainChance: 20 }, image: '/images/dest-osaka.jpg', placeCount: 128,
  },
  {
    id: 'bangkok', name: '방콕', nameEn: 'BANGKOK', country: 'THAILAND', countryKo: '태국', region: 'overseas',
    lat: 13.7563, lng: 100.5018, popularity: 92, themes: ['food', 'city'],
    tagline: '사원 · 야시장 · 마사지', description: '화려한 사원과 활기찬 야시장, 저렴한 마사지가 매력인 도시',
    flightTime: '5시간 40분', recommendedStay: '3박 5일', currency: 'THB',
    climate: { high: 32, low: 24, rainChance: 30 }, image: '/images/dest-bangkok.jpg', placeCount: 156,
  },
  {
    id: 'danang', name: '다낭', nameEn: 'DA NANG', country: 'VIETNAM', countryKo: '베트남', region: 'overseas',
    lat: 16.0544, lng: 108.2022, popularity: 90, themes: ['resort', 'nature'],
    tagline: '해변 · 리조트 · 바나힐', description: '긴 해변과 리조트, 근교 호이안까지 함께 즐기는 휴양 도시',
    flightTime: '4시간 30분', recommendedStay: '4박 5일', currency: 'VND',
    climate: { high: 26, low: 21, rainChance: 70 }, image: '/images/dest-danang.jpg', placeCount: 94,
  },
  {
    id: 'taipei', name: '타이베이', nameEn: 'TAIPEI', country: 'TAIWAN', countryKo: '대만', region: 'overseas',
    lat: 25.033, lng: 121.5654, popularity: 86, themes: ['food', 'city'],
    tagline: '야시장 · 온천 · 근교 여행', description: '야시장 먹거리와 근교 온천, 지우펀까지 짧게 다녀오기 좋은 도시',
    flightTime: '2시간 30분', recommendedStay: '2박 3일', currency: 'TWD',
    climate: { high: 24, low: 18, rainChance: 40 }, image: '/images/dest-taipei.jpg', placeCount: 112,
  },
  {
    id: 'sapporo', name: '삿포로', nameEn: 'SAPPORO', country: 'JAPAN', countryKo: '일본', region: 'overseas',
    lat: 43.0618, lng: 141.3545, popularity: 78, themes: ['nature', 'food'],
    tagline: '눈 축제 · 해산물 · 온천', description: '겨울 설경과 신선한 해산물, 근교 온천 마을이 있는 홋카이도 도시',
    flightTime: '2시간 40분', recommendedStay: '3박 4일', currency: 'JPY',
    climate: { high: 8, low: 1, rainChance: 50 }, image: '/images/dest-sapporo.jpg', placeCount: 76,
  },
  {
    id: 'singapore', name: '싱가포르', nameEn: 'SINGAPORE', country: 'SINGAPORE', countryKo: '싱가포르', region: 'overseas',
    lat: 1.3521, lng: 103.8198, popularity: 80, themes: ['city'],
    tagline: '야경 · 가든 · 미식', description: '깔끔한 도심과 정원, 다양한 음식 문화가 섞인 도시 국가',
    flightTime: '6시간 20분', recommendedStay: '3박 5일', currency: 'SGD',
    climate: { high: 31, low: 25, rainChance: 70 }, image: '/images/dest-singapore.jpg', placeCount: 88,
  },
  {
    id: 'bali', name: '발리', nameEn: 'BALI', country: 'INDONESIA', countryKo: '인도네시아', region: 'overseas',
    lat: -8.4095, lng: 115.1889, popularity: 82, themes: ['resort', 'nature'],
    tagline: '라이스 테라스 · 사원 · 서핑', description: '계단식 논과 사원, 해변 리조트가 어우러진 휴양 섬',
    flightTime: '7시간', recommendedStay: '4박 6일', currency: 'IDR',
    climate: { high: 31, low: 24, rainChance: 60 }, image: '/images/dest-bali.jpg', placeCount: 70,
  },
  {
    id: 'guam', name: '괌', nameEn: 'GUAM', country: 'USA', countryKo: '미국(괌)', region: 'overseas',
    lat: 13.4443, lng: 144.7937, popularity: 74, themes: ['resort'],
    tagline: '해변 · 쇼핑 · 스노클링', description: '맑은 바다와 면세 쇼핑을 가까운 거리에서 즐기는 휴양지',
    flightTime: '4시간 20분', recommendedStay: '3박 5일', currency: 'USD',
    climate: { high: 30, low: 25, rainChance: 50 }, image: '/images/dest-guam.jpg', placeCount: 52,
  },
  {
    id: 'sydney', name: '시드니', nameEn: 'SYDNEY', country: 'AUSTRALIA', countryKo: '호주', region: 'overseas',
    lat: -33.8688, lng: 151.2093, popularity: 72, themes: ['city', 'nature'],
    tagline: '하버 · 해변 · 브런치', description: '오페라하우스와 해변 산책, 브런치 카페가 유명한 항구 도시',
    flightTime: '10시간 30분', recommendedStay: '5박 7일', currency: 'AUD',
    climate: { high: 25, low: 16, rainChance: 30 }, image: '/images/dest-sydney.jpg', placeCount: 81,
  },
  {
    id: 'jeju', name: '제주', nameEn: 'JEJU', country: 'KOREA', countryKo: '대한민국', region: 'domestic',
    lat: 33.4996, lng: 126.5312, popularity: 95, themes: ['nature', 'resort'],
    tagline: '오름 · 해안도로 · 감귤', description: '오름과 해안도로, 감귤밭을 따라 드라이브하기 좋은 섬',
    flightTime: '1시간 10분', recommendedStay: '2박 3일', currency: 'KRW',
    climate: { high: 18, low: 12, rainChance: 40 }, image: '/images/dest-jeju.jpg', placeCount: 140,
  },
  {
    id: 'busan', name: '부산', nameEn: 'BUSAN', country: 'KOREA', countryKo: '대한민국', region: 'domestic',
    lat: 35.1796, lng: 129.0756, popularity: 93, themes: ['food', 'city'],
    tagline: '바다 · 야경 · 해산물', description: '바다와 야경, 시장 먹거리가 가득한 항구 도시',
    flightTime: null, recommendedStay: '2박 3일', currency: 'KRW',
    climate: { high: 16, low: 9, rainChance: 20 }, image: '/images/dest-busan.jpg', placeCount: 128,
  },
  {
    id: 'gangneung', name: '강릉', nameEn: 'GANGNEUNG', country: 'KOREA', countryKo: '대한민국', region: 'domestic',
    lat: 37.7519, lng: 128.8761, popularity: 84, themes: ['nature', 'food'],
    tagline: '바다 · 카페거리 · 일출', description: '동해 바다와 커피거리, 일출 명소가 있는 바닷가 도시',
    flightTime: null, recommendedStay: '1박 2일', currency: 'KRW',
    climate: { high: 13, low: 4, rainChance: 20 }, image: '/images/dest-gangneung.jpg', placeCount: 64,
  },
  {
    id: 'gyeongju', name: '경주', nameEn: 'GYEONGJU', country: 'KOREA', countryKo: '대한민국', region: 'domestic',
    lat: 35.8562, lng: 129.2247, popularity: 80, themes: ['city', 'nature'],
    tagline: '역사 · 한옥 · 단풍', description: '천년 고도의 유적과 한옥 골목, 가을 단풍이 아름다운 도시',
    flightTime: null, recommendedStay: '1박 2일', currency: 'KRW',
    climate: { high: 14, low: 3, rainChance: 20 }, image: '/images/dest-gyeongju.jpg', placeCount: 58,
  },
];

export const ORIGIN = { name: '서울', lat: 37.5665, lng: 126.978 };

export const THEME_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'resort', label: '휴양', color: 'var(--color-category-transport)' },
  { id: 'food', label: '미식', color: 'var(--color-category-food)' },
  { id: 'city', label: '도시', color: 'var(--color-category-culture)' },
  { id: 'nature', label: '자연', color: 'var(--color-category-nature)' },
] as const;

export const getDestination = (id: string | null) => DESTINATIONS.find((d) => d.id === id) ?? null;
