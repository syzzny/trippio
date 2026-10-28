const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 'YYYY-MM-DD' → 로컬 Date (타임존 밀림 방지) */
export const parseISODate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const toISODate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const addDays = (iso: string, days: number) => {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

export const diffDays = (fromISO: string, toISO: string) =>
  Math.round((parseISODate(toISO).getTime() - parseISODate(fromISO).getTime()) / 86_400_000);

/** 11.14 (토) */
export const formatShort = (iso: string) => {
  const d = parseISODate(iso);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')} (${WEEKDAYS[d.getDay()]})`;
};

export const weekday = (iso: string) => WEEKDAYS[parseISODate(iso).getDay()];

/** 3박 4일 */
export const formatStay = (startISO: string, endISO: string) => {
  const nights = diffDays(startISO, endISO);
  if (nights <= 0) return '당일치기';
  return `${nights}박 ${nights + 1}일`;
};

export const todayISO = () => toISODate(new Date());
