// 배포(Vercel) 환경의 /api/fx 엔드포인트. 개발 중에는 vite.config.ts의 미들웨어가 같은 로직을 실행해요.
import { FxError, getKrwRates, parseCurrencies } from '../server/fx';

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const data = await getKrwRates(process.env.OPENEXCHANGERATES_APP_ID, parseCurrencies(url.searchParams.get('currencies')));
    return Response.json(data, {
      // CDN에서도 1시간 캐시해 제공처 호출 횟수를 줄여요
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
    });
  } catch (e) {
    const status = e instanceof FxError ? e.status : 500;
    return Response.json({ message: (e as Error).message }, { status });
  }
}
