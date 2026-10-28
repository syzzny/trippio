import { useCallback, useState } from 'react';

export const readChecked = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (key: string, list: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* 저장소를 못 쓰는 환경에서는 화면 상태만 유지 */
  }
};

/** 준비물 체크 상태 — 여행(여행지·날짜)마다 이 브라우저에 저장해요 */
export function useChecklist(key: string, items: string[]) {
  const [state, setState] = useState(() => ({ key, list: readChecked(key) }));
  const checked = state.key === key ? state.list : readChecked(key);

  const toggle = useCallback(
    (item: string) =>
      setState((prev) => {
        const cur = prev.key === key ? prev.list : readChecked(key);
        const next = cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item];
        write(key, next);
        return { key, list: next };
      }),
    [key],
  );

  const done = items.filter((i) => checked.includes(i)).length;
  return { isChecked: (item: string) => checked.includes(item), toggle, done, total: items.length };
}
