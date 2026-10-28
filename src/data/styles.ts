import type { TravelStyle } from '@/types/trip';

export const TRAVEL_STYLES: { id: TravelStyle; label: string; icon: string }[] = [
  { id: 'food', label: '맛집 탐방', icon: '/images/3d-food.jpg' },
  { id: 'nature', label: '자연 · 바다', icon: '/images/3d-nature.jpg' },
  { id: 'culture', label: '문화 · 역사', icon: '/images/3d-culture.jpg' },
  { id: 'cafe', label: '카페 투어', icon: '/images/3d-cafe.jpg' },
  { id: 'shopping', label: '쇼핑', icon: '/images/3d-shopping.jpg' },
  { id: 'activity', label: '액티비티', icon: '/images/3d-activity.jpg' },
];

export const STYLE_LABEL: Record<TravelStyle, string> = Object.fromEntries(
  TRAVEL_STYLES.map((s) => [s.id, s.label.split(' ')[0]]),
) as Record<TravelStyle, string>;
