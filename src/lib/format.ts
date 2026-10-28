export const formatManwon = (won: number) => {
  const man = won / 10_000;
  return Number.isInteger(man) ? `${man}만` : `${man.toFixed(1)}만`;
};

export const formatNumber = (n: number) => n.toLocaleString('ko-KR');

export const CURRENCY_SYMBOL: Record<string, string> = {
  JPY: '¥', USD: '$', THB: '฿', VND: '₫', TWD: 'NT$', SGD: 'S$', IDR: 'Rp', AUD: 'A$', KRW: '₩',
};

/** 통화마다 사람이 읽기 좋은 표시 단위 (100엔, 1달러 …) */
export const CURRENCY_UNIT: Record<string, number> = {
  JPY: 100, VND: 100, IDR: 100, USD: 1, THB: 1, TWD: 1, SGD: 1, AUD: 1, KRW: 1,
};

export const CURRENCY_NAME: Record<string, string> = {
  JPY: '엔', USD: '달러', THB: '바트', VND: '동', TWD: '대만달러', SGD: '싱가포르달러', IDR: '루피아', AUD: '호주달러', KRW: '원',
};

/** 금액을 유효숫자 기준으로 보기 좋게 반올림 (57,613 → 57,600) */
export const roundNice = (n: number, digits = 3) => {
  if (n <= 0) return 0;
  const step = 10 ** Math.max(0, Math.floor(Math.log10(n)) - (digits - 1));
  return Math.round(n / step) * step;
};

/** 7.0만 — 소수 첫째 자리까지 고정 */
export const formatManwonFixed = (won: number) => `${(won / 10_000).toFixed(1)}만`;
