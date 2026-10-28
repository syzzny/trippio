// 배포(Vercel) 환경의 /api/ai-edit 엔드포인트. 개발 중에는 vite.config.ts의 미들웨어가 같은 로직을 실행해요.
import { EditError, editItinerary, type EditRequest } from '../server/aiEdit.js';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EditRequest;
    const data = await editItinerary(process.env.GROQ_API_KEY, body, process.env.GROQ_MODEL || undefined);
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    const status = e instanceof EditError ? e.status : 500;
    return Response.json({ message: (e as Error).message }, { status });
  }
}
