// 배포(Vercel) 환경의 /api/places 엔드포인트. 개발 중에는 vite.config.ts의 미들웨어가 같은 로직을 실행해요.
import { PlacesError, getPlacesNear, parseLatLng } from '../server/places.js';

export async function GET(request: Request) {
  const { lat, lng, name } = parseLatLng(new URL(request.url));
  try {
    const data = await getPlacesNear(process.env.FOURSQUARE_API_KEY, lat, lng, {
      aiKey: process.env.GROQ_API_KEY,
      aiModel: process.env.GROQ_MODEL,
      destName: name,
    });
    return Response.json(data, {
      // 같은 여행지는 CDN에서 6시간 캐시해 호출 수를 줄여요
      headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600' },
    });
  } catch (e) {
    const status = e instanceof PlacesError ? e.status : 500;
    return Response.json({ message: (e as Error).message }, { status });
  }
}
