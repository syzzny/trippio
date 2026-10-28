import { useSyncExternalStore } from 'react';

/** CSS 미디어 쿼리 결과를 구독해요 (화면 크기가 바뀌면 다시 렌더링) */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** _tokens.scss의 $bp-mobile(768px)과 같은 기준 */
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
