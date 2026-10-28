import { fetchForecast } from './weather';
import { fetchPlaces } from './places';
import { planItinerary } from '@/lib/planner';
import type { Destination, TripDraft } from '@/types/trip';
import type { GenerationStep, Itinerary } from '@/types/itinerary';

export const GENERATION_STEPS: { id: GenerationStep; title: string }[] = [
  { id: 'weather', title: '여행 기간 날씨 확인' },
  { id: 'places', title: '조건에 맞는 장소 탐색' },
  { id: 'route', title: '이동 동선 최적화' },
  { id: 'budget', title: '예산 배분 · 일정 확정' },
];

export class GenerationError extends Error {
  constructor(public step: GenerationStep, message: string, public detail: string) {
    super(message);
  }
}

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

interface Options {
  signal?: AbortSignal;
  /** 각 단계가 끝날 때 결과 요약을 알려줘요 (진행 화면 표시용) */
  onStep?: (step: GenerationStep, status: 'running' | 'done', note?: string) => void;
  /** 에러 화면 확인용: 지정한 단계에서 실패시켜요 (?fail=places) */
  failAt?: GenerationStep | null;
}

/**
 * 일정 생성 파이프라인.
 * 지금은 규칙 기반 planner를 쓰고, 단계 사이 대기는 실제 API 호출 시간을 흉내 내요.
 * AI 연동 시 places/route 단계를 LLM 호출로 교체하면 돼요.
 */
export async function generateItinerary(draft: TripDraft, destination: Destination, { signal, onStep, failAt }: Options = {}): Promise<Itinerary> {
  const fail = (step: GenerationStep, message: string, detail: string) => {
    if (failAt === step) throw new GenerationError(step, message, detail);
  };

  onStep?.('weather', 'running');
  const forecast = await fetchForecast(destination, draft.startDate, draft.endDate, signal);
  await wait(500, signal);
  const rainy = forecast.filter((f) => f.rainChance >= 40);
  fail('weather', '날씨 정보를 불러오지 못했어요', 'Weather API 응답 오류 (502)');
  onStep?.(
    'weather',
    'done',
    rainy.length ? `비 예보 ${rainy.length}일 · 실내 일정 비중 ↑` : `${forecast.length}일 모두 맑음 · 야외 일정 위주`,
  );

  onStep?.('places', 'running');
  const [{ places, source, refined }] = await Promise.all([fetchPlaces(destination, signal), wait(700, signal)]);
  fail('places', '장소 정보를 불러오지 못했어요', 'Places API 응답 시간 초과 (10초)');
  const matched = places.filter((p) => draft.styles.includes(p.category)).length;
  onStep?.(
    'places',
    'done',
    source === 'foursquare'
      ? `실제 장소 ${places.length}곳 중 조건에 맞는 ${matched}곳 선별${refined ? ' · 체인점 제외' : ''}`
      : `${places.length}곳 중 조건에 맞는 ${matched}곳 선별 (예시 데이터)`,
  );

  onStep?.('route', 'running');
  await wait(900, signal);
  fail('route', '동선을 계산하지 못했어요', 'Route 계산 오류');
  const itinerary = planItinerary({ draft, destination, forecast, places });
  const transit = itinerary.days.flatMap((d) => d.legs).filter((l) => l.mode === 'transit').length;
  onStep?.('route', 'done', `이동 ${itinerary.days.flatMap((d) => d.legs).length}구간 중 대중교통 ${transit}구간`);

  onStep?.('budget', 'running');
  await wait(600, signal);
  fail('budget', '예산을 배분하지 못했어요', 'Budget 계산 오류');
  onStep?.('budget', 'done', `1인 ${Math.round(draft.budget[1] / 10000)}만원 이내로 조정`);

  return itinerary;
}
