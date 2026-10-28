import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { FxError, getKrwRates, parseCurrencies } from './server/fx';
import { PlacesError, getPlacesNear, parseLatLng } from './server/places';
import { EditError, editItinerary } from './server/aiEdit';

/** 개발 서버에서 /api/fx 를 처리 (배포 시 api/fx.ts 와 같은 동작) */
function fxApi(appId: string | undefined): Plugin {
  return {
    name: 'trippio-fx-api',
    configureServer(server) {
      server.middlewares.use('/api/fx', async (req, res) => {
        const url = new URL(req.url ?? '', 'http://localhost');
        try {
          const data = await getKrwRates(appId, parseCurrencies(url.searchParams.get('currencies')));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        } catch (e) {
          res.statusCode = e instanceof FxError ? e.status : 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: (e as Error).message }));
        }
      });
    },
  };
}

/** 개발 서버에서 /api/places 를 처리 (배포 시 api/places.ts 와 같은 동작) */
function placesApi(apiKey: string | undefined, aiKey: string | undefined, aiModel: string | undefined): Plugin {
  return {
    name: 'trippio-places-api',
    configureServer(server) {
      server.middlewares.use('/api/places', async (req, res) => {
        const { lat, lng, name } = parseLatLng(new URL(req.url ?? '', 'http://localhost'));
        res.setHeader('Content-Type', 'application/json');
        try {
          res.end(JSON.stringify(await getPlacesNear(apiKey, lat, lng, { aiKey, aiModel, destName: name })));
        } catch (e) {
          res.statusCode = e instanceof PlacesError ? e.status : 500;
          res.end(JSON.stringify({ message: (e as Error).message }));
        }
      });
    },
  };
}

/** 개발 서버에서 /api/ai-edit 를 처리 (배포 시 api/ai-edit.ts 와 같은 동작) */
function aiEditApi(aiKey: string | undefined, aiModel: string | undefined): Plugin {
  return {
    name: 'trippio-ai-edit-api',
    configureServer(server) {
      server.middlewares.use('/api/ai-edit', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        try {
          if (req.method !== 'POST') throw new EditError(405, 'POST로 요청해 주세요');
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
          res.end(JSON.stringify(await editItinerary(aiKey, body, aiModel || undefined)));
        } catch (e) {
          res.statusCode = e instanceof EditError ? e.status : 500;
          res.end(JSON.stringify({ message: (e as Error).message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // VITE_ 접두사가 없는 값은 브라우저 번들에 들어가지 않아요 (서버에서만 사용)
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      fxApi(env.OPENEXCHANGERATES_APP_ID),
      placesApi(env.FOURSQUARE_API_KEY, env.GROQ_API_KEY, env.GROQ_MODEL),
      aiEditApi(env.GROQ_API_KEY, env.GROQ_MODEL),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          additionalData: `@use "@/styles/abstracts" as *;\n`,
        },
      },
    },
  };
});
