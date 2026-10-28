/** Groq(OpenAI 호환) 공통 — 모델 자동 선택과 채팅 호출 */
export const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
/** 쓸 수 있는 모델 중 앞에 있는 것부터 골라요 (Groq는 모델이 자주 바뀌어서 목록에서 확인해요) */
const PREFERRED_MODELS = [
  'openai/gpt-oss-120b',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'llama-3.3-70b-versatile',
  'qwen/qwen3-32b',
  'openai/gpt-oss-20b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
];
let pickedModel: { at: number; id: string } | null = null;

export async function pickModel(apiKey: string, preferred?: string) {
  if (preferred) return preferred;
  if (pickedModel && Date.now() - pickedModel.at < 24 * 60 * 60 * 1000) return pickedModel.id;
  const res = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) throw new Error(`Groq 모델 목록 오류 (${res.status})`);
  const ids = new Set(((await res.json()) as { data?: { id: string }[] }).data?.map((m) => m.id) ?? []);
  const id = PREFERRED_MODELS.find((m) => ids.has(m));
  if (!id) throw new Error(`쓸 수 있는 모델이 없어요: ${[...ids].slice(0, 8).join(', ')}`);
  pickedModel = { at: Date.now(), id };
  return id;
}

/** 한 번 묻고 답 텍스트를 받아요 */
export async function chat(
  apiKey: string,
  { system, user, preferredModel, maxTokens = 4000, timeoutMs = 40_000 }: {
    system: string;
    user: string;
    preferredModel?: string;
    maxTokens?: number;
    timeoutMs?: number;
  },
) {
  const model = await pickModel(apiKey, preferredModel);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_completion_tokens: maxTokens,
        ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Groq 응답 오류 (${res.status}) ${(await res.text()).slice(0, 200)}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { text: data.choices?.[0]?.message?.content ?? '', model };
  } finally {
    clearTimeout(timer);
  }
}
