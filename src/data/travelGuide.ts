// 여행지별 "한눈에 보기" 정보 — 목업 데이터. 이후 AI 응답으로 같은 형태를 채울 수 있어요.

export type TipIcon = 'plug' | 'card' | 'coins' | 'phone' | 'train' | 'shirt';

export interface MustEat {
  name: string;
  desc: string;
  /** 현지 통화 기준 대략 가격 */
  price: number;
  image: string;
}

export interface TravelGuide {
  /** 체크리스트 고정 항목 (우산 등 날씨 항목은 일정에서 자동으로 추가) */
  checklist: string[];
  /** 경비 중 현금으로 준비하면 좋은 비율 (숙박 제외) */
  cashRatio: number;
  cashNote: string;
  mustEat: MustEat[];
  tips: { icon: TipIcon; text: string }[];
}

const FOOD = '/images/3d-food.jpg';

const GUIDES: Record<string, TravelGuide> = {
  osaka: {
    checklist: ['여권', 'eSIM · 포켓와이파이', '110V 돼지코 어댑터', '이코카 교통카드', '편한 운동화'],
    cashRatio: 0.45,
    cashNote: '시장·노점은 현금만 받는 곳이 많아요',
    mustEat: [
      { name: '타코야키', desc: '도톤보리 길거리 간식', price: 600, image: '/images/3d-takoyaki.jpg' },
      { name: '오코노미야키', desc: '오사카식 철판 요리', price: 1200, image: '/images/3d-okonomiyaki.jpg' },
      { name: '라멘', desc: '진한 돈코츠 국물', price: 900, image: FOOD },
    ],
    tips: [
      { icon: 'plug', text: '전압 100V라 돼지코 어댑터가 필요해요' },
      { icon: 'card', text: '이코카 카드로 지하철·편의점 결제 OK' },
      { icon: 'coins', text: '팁 문화가 없어서 따로 안 줘도 돼요' },
      { icon: 'phone', text: '긴급 시 주오사카 대한민국 총영사관' },
    ],
  },
  sapporo: {
    checklist: ['여권', 'eSIM · 포켓와이파이', '110V 돼지코 어댑터', '미끄럼 방지 신발', '두꺼운 외투'],
    cashRatio: 0.4,
    cashNote: '작은 식당·온천은 현금만 받기도 해요',
    mustEat: [
      { name: '징기스칸', desc: '양고기 철판구이', price: 2500, image: '/images/3d-food-bbq.jpg' },
      { name: '수프카레', desc: '삿포로 대표 로컬 음식', price: 1500, image: '/images/3d-food-rice.jpg' },
      { name: '해산물 덮밥', desc: '니조 시장 아침 메뉴', price: 3000, image: '/images/3d-food-sushi.jpg' },
    ],
    tips: [
      { icon: 'plug', text: '전압 100V라 돼지코 어댑터가 필요해요' },
      { icon: 'shirt', text: '실내는 따뜻하니 겹쳐 입기 좋아요' },
      { icon: 'coins', text: '팁 문화가 없어서 따로 안 줘도 돼요' },
      { icon: 'phone', text: '긴급 시 주삿포로 대한민국 총영사관' },
    ],
  },
  bangkok: {
    checklist: ['여권', 'eSIM · 포켓와이파이', '모기 기피제', '얇은 긴 옷 (사원 방문)', '편한 샌들'],
    cashRatio: 0.6,
    cashNote: '야시장·툭툭은 현금 위주예요',
    mustEat: [
      { name: '팟타이', desc: '태국식 볶음 쌀국수', price: 80, image: FOOD },
      { name: '똠얌꿍', desc: '새콤 매콤한 새우 수프', price: 150, image: '/images/3d-food-dumpling.jpg' },
      { name: '망고 찹쌀밥', desc: '달콤한 길거리 디저트', price: 100, image: '/images/3d-food-rice.jpg' },
    ],
    tips: [
      { icon: 'shirt', text: '사원은 어깨·무릎을 가리는 옷이 필요해요' },
      { icon: 'train', text: 'BTS·MRT로 교통 체증을 피하세요' },
      { icon: 'coins', text: '마사지숍은 20~50바트 정도 팁을 줘요' },
      { icon: 'phone', text: '긴급 시 주태국 대한민국 대사관' },
    ],
  },
};

const GENERIC: TravelGuide = {
  checklist: ['여권', 'eSIM · 포켓와이파이', '여행자 보험', '상비약', '편한 운동화'],
  cashRatio: 0.3,
  cashNote: '대부분 카드 결제가 되지만 소액 현금은 챙겨 두세요',
  mustEat: [],
  tips: [
    { icon: 'card', text: '해외 결제 수수료가 없는 카드를 챙기면 좋아요' },
    { icon: 'plug', text: '전압과 콘센트 모양을 미리 확인하세요' },
    { icon: 'phone', text: '긴급 시 영사콜센터 +82-2-3210-0404' },
  ],
};

const DOMESTIC: TravelGuide = {
  checklist: ['신분증', '보조배터리', '선크림', '편한 운동화'],
  cashRatio: 0,
  cashNote: '',
  mustEat: [],
  tips: [
    { icon: 'card', text: '대부분 카드·간편결제가 돼요' },
    { icon: 'train', text: '렌터카는 미리 예약할수록 저렴해요' },
  ],
};

export const getTravelGuide = (destinationId: string, domestic: boolean): TravelGuide =>
  GUIDES[destinationId] ?? (domestic ? DOMESTIC : GENERIC);
