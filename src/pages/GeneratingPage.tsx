import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { Button, SmartImage } from '@/components/ui';
import { SplitView } from '@/components/common/SplitView';
import { PanelHeader } from '@/components/common/PanelHeader';
import { StepProgress } from '@/components/common/StepProgress';
import { BaseMap } from '@/features/map/BaseMap';
import { StepList, type StepState } from '@/features/generating/StepList';
import { SkeletonPanel } from '@/features/generating/SkeletonPanel';
import { GENERATION_STEPS, GenerationError, generateItinerary } from '@/api/itinerary';
import { getDestination } from '@/data/destinations';
import { STYLE_LABEL } from '@/data/styles';
import { useTripDraft } from '@/store/TripDraftContext';
import { useItinerary } from '@/store/ItineraryContext';
import { formatShort, formatStay } from '@/lib/date';
import { formatManwon } from '@/lib/format';
import { readPreferences } from '@/lib/planner';
import type { GenerationStep } from '@/types/itinerary';
import styles from './GeneratingPage.module.scss';

const initialStates = () =>
  Object.fromEntries(GENERATION_STEPS.map((s) => [s.id, 'todo'])) as Record<GenerationStep, StepState>;

export default function GeneratingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { draft } = useTripDraft();
  const { setItinerary } = useItinerary();
  const dest = getDestination(draft.destinationId);

  const [attempt, setAttempt] = useState(0);
  const [states, setStates] = useState(initialStates);
  const [notes, setNotes] = useState<Partial<Record<GenerationStep, string>>>({});
  const [error, setError] = useState<GenerationError | Error | null>(null);

  // 에러 화면 확인용: /generating?fail=places (재시도하면 정상 진행)
  const failAt = useMemo(() => {
    const f = new URLSearchParams(location.search).get('fail');
    return attempt === 0 && GENERATION_STEPS.some((s) => s.id === f) ? (f as GenerationStep) : null;
  }, [location.search, attempt]);

  useEffect(() => {
    if (!dest) return;
    const controller = new AbortController();
    setStates(initialStates());
    setNotes({});
    setError(null);

    generateItinerary(draft, dest, {
      signal: controller.signal,
      failAt,
      onStep: (step, status, note) => {
        setStates((s) => ({ ...s, [step]: status }));
        if (note) setNotes((n) => ({ ...n, [step]: note }));
      },
    })
      .then((itinerary) => {
        setItinerary(itinerary);
        navigate('/plan', { replace: true });
      })
      .catch((e: Error) => {
        if (e.name === 'AbortError') return;
        if (e instanceof GenerationError) {
          setStates((s) => ({ ...s, [e.step]: 'failed' }));
          setNotes((n) => ({ ...n, [e.step]: e.detail }));
        }
        setError(e);
      });

    return () => controller.abort();
    // draft는 이 화면에서 바뀌지 않아요. 재시도(attempt) 때만 다시 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  if (!dest) return <Navigate to="/" replace />;

  const doneCount = Object.values(states).filter((s) => s === 'done').length;
  const percent = Math.round((doneCount / GENERATION_STEPS.length) * 100);
  const prefs = readPreferences(draft.request);
  const focus = [prefs.lessWalking && '덜 걷기', prefs.localFood && '현지 맛집', prefs.relaxed && '여유로운 일정'].filter(Boolean);
  const focusText = focus.length ? `“${focus.join(' · ')}”` : draft.styles.map((s) => STYLE_LABEL[s]).join(' · ');
  const failed = !!error;

  const panel = (
    <div className={styles.panel}>
      <PanelHeader
        step={3}
        total={3}
        stepLabel={failed ? 'FAILED' : 'GENERATING'}
        title={`${dest.name} ${formatStay(draft.startDate, draft.endDate)}`}
        description={`${formatShort(draft.startDate)} – ${formatShort(draft.endDate)} · 성인 ${draft.adults}명 · 1인 예산 ${formatManwon(draft.budget[1])}원`}
        top={
          <div className={styles.top}>
            <button type="button" className={styles.back} onClick={() => navigate('/conditions')}>
              <ArrowLeft size={16} aria-hidden /> 조건 수정
            </button>
            <StepProgress current={3} total={3} />
          </div>
        }
      />
      <SkeletonPanel dimmed={failed} />
      <Button variant="secondary" fullWidth disabled>
        {failed ? '일정을 만들지 못했어요' : '일정을 만드는 중…'}
      </Button>
    </div>
  );

  const map = (
    <>
      <BaseMap center={[dest.lat, dest.lng]} zoom={12} label={`${dest.name} 지도`} zoomPosition="bottomright" />
      <div className={styles.veil} aria-hidden />
      <section
        className={clsx(styles.card, failed && styles.failed)}
        aria-labelledby="gen-title"
        role={failed ? 'alert' : undefined}
      >
        <SmartImage
          src={failed ? '/images/3d-pio-sorry.jpg' : '/images/3d-pio-thinking.jpg'}
          alt=""
          blend
          className={clsx(styles.illust, !failed && styles.float)}
        />
        <div className={styles.text}>
          <h2 id="gen-title" className={styles.title}>
            {failed ? '일정을 만들지 못했어요' : '피오가 일정을 짜고 있어요'}
          </h2>
          <p className={styles.desc}>
            {failed
              ? '미안해요, 장소 정보를 불러오는 중 응답이 늦어지고 있어요. 입력하신 조건은 그대로 저장돼 있으니 다시 시도해 주세요.'
              : `요청하신 ${focusText} 조건을 반영해 동선을 계산하는 중이에요.`}
          </p>
        </div>

        {!failed && (
          <div className={styles.progress}>
            <div className={styles.progressLabel}>
              <span>{percent}%</span>
              <span className={styles.muted}>{GENERATION_STEPS.length - doneCount}단계 남음</span>
            </div>
            <div
              className={styles.track}
              role="progressbar"
              aria-label="일정 생성 진행률"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span className={styles.fill} style={{ width: `${Math.max(6, percent)}%` }} />
            </div>
          </div>
        )}

        <div aria-live="polite">
          <StepList states={states} notes={notes} />
        </div>

        {failed && (
          <>
            <div className={styles.actions}>
              <Button variant="primary" fullWidth onClick={() => setAttempt((a) => a + 1)}>
                다시 시도하기
              </Button>
              <Button variant="secondary" fullWidth onClick={() => navigate('/conditions')}>
                조건 수정하기
              </Button>
            </div>
            <p className={styles.hint}>문제가 계속되면 잠시 후 다시 시도하거나 다른 여행지를 선택해 보세요</p>
          </>
        )}
      </section>
    </>
  );

  return <SplitView panel={panel} map={map} panelLabel="일정 생성" mobileMap="content" />;
}
