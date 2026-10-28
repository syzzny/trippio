/**
 * AI 장소 다듬기 (Groq · OpenAI 호환 Chat Completions)
 *
 * Foursquare 무료 데이터는 이름이 영어·현지어로 오고, 체인점과 현지 맛집을 구분하지 못해요.
 * AI에게 장소 목록을 한 번에 보내서
 *  - 한국 여행자가 쓰는 한국어 이름
 *  - 체인점 여부
 *  - 한국 여행자 기준 추천 점수 (0~100)
 *  - 한 줄 소개
 * 를 받아 와요. 실패하면 원래 데이터를 그대로 써요 (일정 생성은 멈추지 않아요).
 */
import type { ApiPlace } from './places';
import { ENDPOINT, pickModel } from './groq';

const TIMEOUT_MS = 40_000;

interface RefineItem {
  i: number;
  ko?: string;
  c?: boolean;
  s?: number;
  d?: string;
}

const SYSTEM = `너는 한국인 여행자를 위한 여행 가이드 편집자야.
장소 목록을 받으면 장소마다 정확히 한 줄씩, 아래 형식으로만 출력해. 다른 설명이나 머리말은 쓰지 마.
번호|한국어 이름|체인점(Y/N)|점수|한 줄 소개

- 번호: 입력의 번호 그대로
- 한국어 이름: 한국 여행자가 실제로 부르는 이름. 널리 쓰이는 한국어 이름이 있으면 그것(예: 大阪城 → 오사카성, Kuromon Market → 구로몬 시장). 없으면 원어 발음을 한글로 옮겨 써(예: 焼肉 富鶴 → 야키니쿠 토미츠루). 20자 이내.
- 체인점: 전국·글로벌 체인점이면 Y (예: 맥도날드, 스타벅스, 모스버거, 도토루, 유니클로), 아니면 N
- 점수: 한국 여행자가 일부러 찾아갈 만한 정도 0~100. 유명 명소·현지 명물·오래된 노포는 높게, 체인점·평범한 곳은 낮게.
- 한 줄 소개: 35자 이내 한국어. 확실하지 않은 가격·영업시간·수상 경력은 지어내지 말고 장소의 성격 위주로. 소개 안에 | 기호는 쓰지 마.

예시
3|구로몬 시장|N|88|해산물과 길거리 음식이 가득한 오사카의 부엌`;

/** "번호|이름|Y/N|점수|소개" 줄들을 읽어요 (JSON보다 따옴표 실수에 강해요) */
function parseLines(text: string): RefineItem[] {
  const items: RefineItem[] = [];
  for (const line of text.split('\n')) {
    const parts = line.split('|').map((x) => x.trim());
    if (parts.length < 5 || !/^\d+$/.test(parts[0])) continue;
    const [i, ko, chain, score, ...rest] = parts;
    items.push({ i: Number(i), ko, c: /^y/i.test(chain), s: Number(score), d: rest.join(' ') });
  }
  return items;
}

export async function refinePlaces(apiKey: string | undefined, destName: string, places: ApiPlace[], preferredModel?: string) {
  if (!apiKey) return { places, refined: false, error: 'GROQ_API_KEY가 설정되지 않았어요' };
  if (places.length === 0) return { places, refined: false };

  const list = places
    .map((p, i) => `${i}|${p.name}|${p.category}|${p.tags.join(', ')}`)
    .join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let model = preferredModel ?? '';
  try {
    model = await pickModel(apiKey, preferredModel);
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        // 장소 60여 곳의 결과가 잘리지 않도록 넉넉하게
        max_completion_tokens: 8000,
        // 추론형 모델(gpt-oss)은 생각을 짧게 해서 응답 시간을 줄여요
        ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `여행지: ${destName}\n번호|이름|카테고리|세부 분류\n${list}` },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Groq 응답 오류 (${res.status}) ${(await res.text()).slice(0, 200)}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const items = parseLines(data.choices?.[0]?.message?.content ?? '');
    const byIndex = new Map(items.map((it) => [it.i, it]));
    if (byIndex.size < places.length * 0.5) throw new Error('AI 응답에 빠진 장소가 너무 많아요');

    const refined = places.map((p, i) => {
      const it = byIndex.get(i);
      if (!it) return { place: p, chain: false };
      const ko = typeof it.ko === 'string' && it.ko.trim() ? it.ko.trim().slice(0, 24) : p.name;
      const score = typeof it.s === 'number' && Number.isFinite(it.s) ? Math.max(0, Math.min(100, Math.round(it.s))) : p.popularity;
      const desc = typeof it.d === 'string' && it.d.trim() ? it.d.trim().slice(0, 60) : p.description;
      return {
        place: {
          ...p,
          name: ko,
          // 체인점은 점수를 크게 낮춰 일정에 잘 안 들어가게 해요
          popularity: it.c ? Math.min(score, 30) : score,
          description: desc,
          tags: [...new Set(p.name !== ko ? [p.name, ...p.tags] : p.tags)].slice(0, 3),
        },
        chain: !!it.c,
      };
    });

    // 식당·카페는 체인점을 빼요. 단, 남는 곳이 너무 적으면 그대로 둬요.
    const out: ApiPlace[] = [];
    for (const cat of ['food', 'cafe'] as const) {
      const inCat = refined.filter((r) => r.place.category === cat);
      const local = inCat.filter((r) => !r.chain);
      out.push(...(local.length >= 6 ? local : inCat).map((r) => r.place));
    }
    out.push(...refined.filter((r) => r.place.category !== 'food' && r.place.category !== 'cafe').map((r) => r.place));
    out.sort((a, b) => b.popularity - a.popularity);
    return { places: out, refined: true, model };
  } catch (e) {
    console.warn('[trippio] AI 장소 다듬기 실패, 원본 데이터를 써요:', (e as Error).message);
    return { places, refined: false, error: (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}
