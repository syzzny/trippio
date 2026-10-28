import { useDeferredValue, useMemo } from 'react';
import { DESTINATIONS } from '@/data/destinations';
import type { DestinationTheme, Region } from '@/types/trip';

export function useDestinationFilter(region: Region, query: string, theme: DestinationTheme | 'all') {
  // 타이핑 중 리스트/지도 재계산이 입력을 막지 않도록 지연값 사용
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  return useMemo(
    () =>
      DESTINATIONS.filter((d) => d.region === region)
        .filter((d) => theme === 'all' || d.themes.includes(theme))
        .filter(
          (d) =>
            !deferredQuery ||
            [d.name, d.nameEn, d.country, d.tagline].some((v) => v.toLowerCase().includes(deferredQuery)),
        )
        .sort((a, b) => b.popularity - a.popularity),
    [region, deferredQuery, theme],
  );
}
