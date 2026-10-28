# Trippio · 피오와 떠나는 여행 플래너

여행지와 조건만 고르면 여행 친구 **피오**가 날씨 · 동선 · 예산을 고려해 일정을 세워 주는 여행 플래너입니다.
만들어진 일정은 피오와 대화하듯 고칠 수 있고, 예상 경비 · 준비물 · 날씨를 한눈에 볼 수 있어요.

## 주요 기능

| 화면 | 내용 |
| --- | --- |
| 01 여행지 선택 | 해외 · 국내 여행지 목록 + 지도, 테마 필터, 실시간 환율 미리보기 |
| 02 조건 입력 | 날짜 · 인원 · 1인 예산(이중 슬라이더) · 여행 스타일 · 피오에게 부탁할 것 |
| 03 일정 생성 | 날씨 예보 → 주변 장소 검색 → 일정 배치 단계를 진행 상태로 표시, 실패 시 재시도 |
| 04 일정 결과 | 날짜별 타임라인 + 동선 지도, 드래그로 순서 변경, 장소 추가 · 삭제, 장소 상세(실제 사진) |
| 피오와 대화 | "둘째 날 오후에 쇼핑 넣어줘"처럼 말하면 일정을 고치고, 되돌리기 가능 |
| 05 한눈에 보기 | 예상 경비 차트(ECharts), 날씨, 준비물 체크리스트, 현지 팁 |
| 06 내 여행 | 저장한 여행 목록(D-day · 준비 진행률), 지난 여행, 추천 여행지 |

모바일에서는 하단 탭바와 바텀시트 레이아웃으로 바뀌어요.

## 실행

```bash
npm install
cp .env.example .env.local   # API 키 입력 (없어도 목업 데이터로 실행돼요)
npm run dev                  # http://localhost:5173
npm run build                # 타입 체크 + 프로덕션 빌드
```

## 기술 스택

| 영역 | 사용 기술 | 선택 이유 |
| --- | --- | --- |
| 프레임워크 | React 18 + TypeScript + Vite | 타입 안정성, 빠른 개발 서버, 라우트 단위 코드 스플리팅 |
| 스타일 | SCSS Modules | Figma 변수 → SCSS 토큰 1:1 매핑, 컴포넌트 단위 스코프 |
| 서버 상태 | TanStack Query | REST API 캐싱 · 로딩/에러 상태 · 요청 취소(AbortSignal) |
| 라우팅 | React Router 6 | 단계별 플로우 |
| 지도 | Leaflet + react-leaflet | 해외 지도 지원, 키 없는 무료 타일 |
| 차트 | ECharts 5 (필요한 모듈만 import) | 경비 도넛 차트, SVG 렌더러 |
| 드래그 | dnd-kit | 키보드로도 순서 변경 가능한 접근성 |
| 서버 | Vercel Functions (`api/`) | API 키를 브라우저에 노출하지 않도록 프록시 |

## 외부 API

| API | 용도 | 키 |
| --- | --- | --- |
| [Open-Meteo](https://open-meteo.com) | 여행 기간 날씨 예보 (16일 이후는 평년 기온) | 불필요 |
| [Open Exchange Rates](https://openexchangerates.org) | 실시간 환율 (실패 시 Frankfurter → 기준값) | `OPENEXCHANGERATES_APP_ID` |
| [Foursquare Places](https://foursquare.com/developers) | 여행지 주변 관광지 · 맛집 · 카페 검색 | `FOURSQUARE_API_KEY` |
| [Groq](https://console.groq.com) | 장소 이름 한국어화, 체인점 제외, 피오와의 대화로 일정 수정 | `GROQ_API_KEY` |
| [Wikimedia](https://commons.wikimedia.org) | 장소 실제 사진 (라이선스 · 저작자 표기) | 불필요 |

키가 없거나 호출이 실패하면 `src/data`의 목업 데이터로 대체해 화면이 깨지지 않아요.

## 폴더 구조

```
api/                 # Vercel 서버리스 함수 (fx, places, ai-edit)
server/              # 서버 로직 — 개발 서버(Vite 미들웨어)와 Vercel 함수가 함께 사용
src/
├─ api/              # fetch 래퍼 + TanStack Query 훅
├─ components/
│  ├─ ui/            # 디자인 시스템 컴포넌트 (Button, TextField, Chip …)
│  ├─ layout/        # AppLayout, NavRail, MobileTabBar, Logo
│  └─ common/        # 화면 공통 블록 (SplitView, EChart, EmptyTrip …)
├─ features/         # 화면 단위 기능 (destination, conditions, itinerary, overview, trips, map)
├─ pages/            # 라우트 페이지
├─ store/            # 여행 초안 · 일정 · 저장한 여행 상태
├─ data/             # 목업 데이터, 여행 가이드
├─ lib/              # 일정 배치(동선 최적화) · 날짜 · 포맷 · 한국어 조사 유틸
├─ hooks/
├─ styles/
│  ├─ abstracts/     # 토큰, 타이포 믹스인, 공통 믹스인 (모든 SCSS에 자동 주입)
│  └─ global.scss    # CSS 커스텀 프로퍼티 (Primitives → Semantic)
└─ types/
```

## 디자인 시스템 규칙

- 색상은 Figma `Trippio / Primitives` → `Trippio / Semantic` 구조 그대로 CSS 변수로 정의
- 포인트 색(민트)은 화면당 **최종 액션 1개**에만 사용
- 선택 상태(칩 · 체크 · 탭 · 라디오)는 무채색으로 표현
- 타이포는 Figma 텍스트 스타일과 같은 `text($style, $weight)` 믹스인으로만 지정
- 일러스트는 3D 클레이 스타일로 통일, 마스코트 '피오'가 안내

## 접근성

- 건너뛰기 링크, 랜드마크(`nav`, `main`, `aside`), 의미 있는 heading 구조
- 여행지 목록 `radiogroup` + 방향키 이동, 지역 탭 WAI-ARIA tabs 패턴
- 칩 `aria-pressed`, 카운터 · 대화창 `aria-live`, 이중 슬라이더 `aria-valuetext`
- 일정 드래그는 키보드로도 가능 (dnd-kit KeyboardSensor)
- `:focus-visible` 포커스 링, `prefers-reduced-motion` 대응

## 지도 타일

- 해외: Esri Light Gray Canvas
- 국내: OpenStreetMap (Esri 타일은 한국 상세 데이터가 없어서 국내만 교체)
- 두 타일 모두 CSS 필터로 같은 하늘색 · 흰색 톤으로 맞췄어요.
