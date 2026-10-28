/**
 * 실시간 환율 프록시 (Open Exchange Rates)
 *
 * - API 키를 브라우저에 노출하지 않으려고 서버에서만 호출해요.
 * - 무료 플랜: 1시간마다 갱신, 월 1,000회 → 결과를 1시간 캐시해 한 달 최대 약 744회만 호출해요.
 * - 무료 플랜은 기준 통화가 USD 고정이라, KRW/JPY 같은 교차 환율은 직접 계산해요.
 */

interface OxrLatest {
  timestamp: number; // 초 단위 UNIX 시간
  base: 'USD';
  rates: Record<string, number>;
}

export interface FxResponse {
  /** 1 단위 외화당 원화 (예: JPY → 8.49) */
  krwPerUnit: Record<string, number>;
  /** 환율 기준 시각 (ISO) */
  updatedAt: string;
  source: 'openexchangerates';
}

const CACHE_MS = 60 * 60 * 1000;
let cache: { at: number; data: OxrLatest } | null = null;

export class FxError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function fetchLatest(appId: string): Promise<OxrLatest> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  const res = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${encodeURIComponent(appId)}`);
  if (!res.ok) throw new FxError(502, `환율 제공처 응답 오류 (${res.status})`);
  const data = (await res.json()) as OxrLatest;
  cache = { at: Date.now(), data };
  return data;
}

export async function getKrwRates(appId: string | undefined, currencies: string[]): Promise<FxResponse> {
  if (!appId) throw new FxError(503, 'OPENEXCHANGERATES_APP_ID가 설정되지 않았어요');
  const { rates, timestamp } = await fetchLatest(appId);
  const krwPerUsd = rates.KRW;
  const krwPerUnit: Record<string, number> = {};
  for (const cur of currencies) {
    const perUsd = rates[cur];
    if (perUsd) krwPerUnit[cur] = krwPerUsd / perUsd;
  }
  return { krwPerUnit, updatedAt: new Date(timestamp * 1000).toISOString(), source: 'openexchangerates' };
}

/** 쿼리 문자열의 currencies=JPY,USD 를 안전하게 파싱 */
export const parseCurrencies = (raw: string | null) =>
  (raw ?? '')
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{3}$/.test(c))
    .slice(0, 20);
