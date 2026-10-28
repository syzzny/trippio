/**
 * AI 일정 수정 (Groq)
 *
 * "둘째 날 오후에 쇼핑 넣어줘"처럼 자유로운 요청을 받아, 날짜별 장소 순서만 새로 정해 와요.
 * 시간표·이동 구간·추천 이유는 클라이언트의 planner가 다시 계산해서,
 * AI가 시간을 잘못 계산하거나 없는 장소를 지어내도 일정이 깨지지 않게 해요.
 */
import { chat } from './groq';

export interface EditPlace {
  id: string;
  name: string;
  category: string;
  indoor: boolean;
  fullDay?: boolean;
  /** 세부 종류 (예: 스시, 라멘, 백화점) — '스시 먹고 싶어' 같은 요청에 맞추려고 */
  kind?: string;
  /** 가장 가까운 날과 거리 (예: DAY 3 · 1.2km) — AI가 동선에 맞는 장소를 고르도록 */
  near?: string;
}

export interface EditDay {
  /** 예: 11.15 (일) */
  label: string;
  rainy: boolean;
  high: number;
  /** 지금 순서의 장소 id */
  stops: string[];
}

export interface EditRequest {
  destName: string;
  request: string;
  days: EditDay[];
  places: EditPlace[];
}

export interface EditResponse {
  /** 날짜별 새 장소 id 순서 */
  days: string[][];
  /** 무엇을 바꿨는지 한 줄 요약 */
  message: string;
  model: string;
}

export class EditError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const CATEGORY_KO: Record<string, string> = {
  food: '맛집', cafe: '카페', culture: '문화', nature: '자연', shopping: '쇼핑', activity: '액티비티',
};

const SYSTEM = `너는 한국인 여행자의 여행 일정을 고쳐 주는 플래너야.
현재 일정과 쓸 수 있는 장소 목록, 사용자의 요청을 받으면 요청에 맞게 날짜별 장소 순서를 다시 정해.

규칙
- 장소는 반드시 목록의 번호로만 써. 목록에 없는 장소를 만들지 마.
- 한 장소는 전체 일정에서 한 번만 써.
- 하루에 2~6곳. 첫날과 마지막 날은 3~4곳이 적당해.
- 하루 종일 걸리는 장소가 있는 날은 그 장소와 식사 1곳 정도만.
- 맛집(식당)은 하루 최대 2곳: 점심 1곳, 저녁 1곳. 저녁 식당은 그날 마지막 장소로.
- 다른 날의 식당을 옮겨 오면, 그 날에 빈 끼니는 근처의 다른 식당으로 채워.
- 식사를 넣어 달라는 요청이면 같은 끼니의 기존 식당을 새 식당으로 바꿔 (식당이 3곳이 되면 안 돼).
- 비 오는 날은 실내 장소 위주로.
- 요청과 관계없는 날은 되도록 그대로 둬.
- 이미 요청대로 되어 있으면 그대로 두고, MSG에 그 사실을 알려 줘 (예: 둘째 날 저녁은 이미 스시집 지넨이에요).
- 음식 종류를 말하면(스시, 라멘 등) 세부 종류가 맞는 식당만 골라. 맞는 곳이 없으면 바꾸지 말고 MSG에 그렇다고 써.
- 새 장소를 넣을 때는 '가장 가까운 날'이 그날이고 거리가 짧은 곳을 우선 골라.
- 같은 날 장소들은 이동 동선이 자연스러운 순서로. 아침 첫 장소는 식당이 아닌 곳으로.

출력 형식 (다른 말은 쓰지 마)
DAY 1|번호,번호,번호
DAY 2|번호,번호
...
MSG|무엇을 바꿨는지 한국어 한 문장 (50자 이내, ~했어요 말투). 번호 대신 장소 이름으로 써. 예) 둘째 날 오후에 그랜드 프론트 오사카를 넣었어요`;

const MAX_PLACES = 90;

export async function editItinerary(apiKey: string | undefined, body: EditRequest, preferredModel?: string): Promise<EditResponse> {
  if (!apiKey) throw new EditError(503, 'GROQ_API_KEY가 설정되지 않았어요');
  const request = (body.request ?? '').trim().slice(0, 200);
  if (!request) throw new EditError(400, '요청 내용이 비어 있어요');
  if (!Array.isArray(body.days) || body.days.length === 0 || body.days.length > 14) throw new EditError(400, '일정이 올바르지 않아요');
  const places = (body.places ?? []).slice(0, MAX_PLACES);

  // 긴 id 대신 번호로 주고받아요 (토큰 절약 + 오타 방지)
  const index = new Map(places.map((p, i) => [p.id, i + 1]));
  const list = places
    .map((p, i) => `${i + 1}|${p.name}|${CATEGORY_KO[p.category] ?? p.category}${p.kind ? `(${p.kind})` : ''}|${p.indoor ? '실내' : '야외'}|${p.near ?? '-'}${p.fullDay ? '|하루 종일' : ''}`)
    .join('\n');
  const current = body.days
    .map((d, i) => {
      const nums = d.stops.map((id) => index.get(id)).filter(Boolean).join(',');
      return `DAY ${i + 1} (${d.label}, ${d.rainy ? '비 예보' : '맑음'} ${d.high}°)|${nums}`;
    })
    .join('\n');

  const { text, model } = await chat(apiKey, {
    system: SYSTEM,
    user: `여행지: ${body.destName}\n\n장소 목록 (번호|이름|종류(세부 종류)|실내·야외|가장 가까운 날·거리)\n${list}\n\n현재 일정\n${current}\n\n사용자 요청: ${request}`,
    preferredModel,
    maxTokens: 3000,
  });

  // 응답 읽기 + 검증: 없는 번호·중복은 빼고, 비어 버린 날은 원래 일정을 유지해요
  const used = new Set<number>();
  const parsed = new Map<number, string[]>();
  let message = '';
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const day = line.match(/^DAY\s*(\d+)[^|]*\|(.*)$/i);
    if (day) {
      const d = Number(day[1]) - 1;
      if (d < 0 || d >= body.days.length || parsed.has(d)) continue;
      const ids: string[] = [];
      for (const n of day[2].split(/[,\s]+/).map(Number)) {
        if (!Number.isInteger(n) || n < 1 || n > places.length || used.has(n)) continue;
        used.add(n);
        ids.push(places[n - 1].id);
      }
      parsed.set(d, ids.slice(0, 7));
      continue;
    }
    const msg = line.match(/^MSG\s*\|(.*)$/i);
    if (msg) message = msg[1].trim().slice(0, 80);
  }
  if (parsed.size === 0) throw new EditError(502, 'AI 응답을 읽지 못했어요');

  const days = body.days.map((d, i) => {
    const next = parsed.get(i);
    return next && next.length > 0 ? next : d.stops;
  });
  return { days, message, model };
}
