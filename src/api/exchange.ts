import { useQuery } from '@tanstack/react-query';
import { getJSON } from './http';

interface FxApiResponse {
  krwPerUnit: Record<string, number>;
  updatedAt: string;
}

interface FrankfurterLatest {
  date: string;
  rates: Record<string, number>;
}

/** 모든 제공처가 실패했을 때 마지막으로 쓰는 대략값 (KRW per 1 unit) */
const FALLBACK_KRW: Record<string, number> = {
  JPY: 9.1, USD: 1380, THB: 39, VND: 0.055, TWD: 43, SGD: 1030, IDR: 0.087, AUD: 900,
};

export interface ExchangeRate {
  currency: string;
  krwPerUnit: number;
  /** 기준 시각 (ISO) — realtime이면 시각, daily면 고시일 */
  asOf: string | null;
  /** realtime: 1시간 단위 시세 / daily: 하루 1회 고시 / fallback: 고정값 */
  kind: 'realtime' | 'daily' | 'fallback';
}

export async function fetchExchangeRate(currency: string, signal?: AbortSignal): Promise<ExchangeRate> {
  if (currency === 'KRW') return { currency, krwPerUnit: 1, asOf: null, kind: 'realtime' };

  // 1순위: 서버 프록시를 거친 시세 (Open Exchange Rates, 1시간 갱신)
  try {
    const data = await getJSON<FxApiResponse>(`/api/fx?currencies=${currency}`, signal);
    const rate = data.krwPerUnit[currency];
    if (rate) return { currency, krwPerUnit: rate, asOf: data.updatedAt, kind: 'realtime' };
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
  }

  // 2순위: 키 없이 쓰는 ECB 기준 환율 (하루 1회)
  try {
    const data = await getJSON<FrankfurterLatest>(
      `https://api.frankfurter.dev/v1/latest?base=${currency}&symbols=KRW`,
      signal,
    );
    return { currency, krwPerUnit: data.rates.KRW, asOf: data.date, kind: 'daily' };
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
  }

  return { currency, krwPerUnit: FALLBACK_KRW[currency] ?? 1, asOf: null, kind: 'fallback' };
}

export const useExchangeRate = (currency: string | undefined) =>
  useQuery({
    queryKey: ['exchange', currency],
    queryFn: ({ signal }) => fetchExchangeRate(currency!, signal),
    enabled: !!currency,
    staleTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 30,
  });

/** 화면 표기: "실시간 · 14:00 기준" / "10.27 고시 기준" / "참고 환율" */
export const rateLabel = (rate: ExchangeRate | undefined) => {
  if (!rate) return '';
  if (rate.kind === 'fallback' || !rate.asOf) return '참고 환율';
  if (rate.kind === 'daily') {
    const [, m, d] = rate.asOf.split('-');
    return `${Number(m)}.${d} 고시 기준`;
  }
  const t = new Date(rate.asOf);
  return `국제 시세 · ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')} 기준 (1시간마다 갱신)`;
};

/** 좁은 자리용 짧은 표기: "환율 · 13:00" / "환율 (10.27)" */
export const rateShortLabel = (rate: ExchangeRate | undefined) => {
  if (!rate) return '환율';
  if (rate.kind === 'realtime' && rate.asOf) {
    const t = new Date(rate.asOf);
    return `환율 · ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  }
  if (rate.kind === 'daily' && rate.asOf) {
    const [, m, d] = rate.asOf.split('-');
    return `환율 (${Number(m)}.${d})`;
  }
  return '참고 환율';
};
