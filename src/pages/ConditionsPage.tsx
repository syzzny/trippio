import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Marker } from 'react-leaflet';
import { Button, Chip, Counter, SmartImage, Textarea } from '@/components/ui';
import { SplitView } from '@/components/common/SplitView';
import { PanelHeader } from '@/components/common/PanelHeader';
import { StepProgress } from '@/components/common/StepProgress';
import { DateRangeField } from '@/features/conditions/DateRangeField';
import { BudgetRange } from '@/features/conditions/BudgetRange';
import { TripSummary } from '@/features/conditions/TripSummary';
import { BaseMap } from '@/features/map/BaseMap';
import { destinationIcon } from '@/features/map/markers';
import { rateLabel, useExchangeRate } from '@/api/exchange';
import { getDestination } from '@/data/destinations';
import { TRAVEL_STYLES } from '@/data/styles';
import { useTripDraft } from '@/store/TripDraftContext';
import { formatStay } from '@/lib/date';
import { CURRENCY_SYMBOL, formatManwon } from '@/lib/format';
import styles from './ConditionsPage.module.scss';

export default function ConditionsPage() {
  const navigate = useNavigate();
  const { draft, dispatch } = useTripDraft();
  const dest = getDestination(draft.destinationId);
  const { data: rate } = useExchangeRate(dest?.currency);

  const foreignBudget = useMemo(() => {
    if (!dest || dest.currency === 'KRW' || !rate) return null;
    const sym = CURRENCY_SYMBOL[dest.currency] ?? '';
    const conv = (won: number) => {
      const raw = won / rate.krwPerUnit;
      const rounded = raw >= 1000 ? Math.round(raw / 100) * 100 : Math.round(raw);
      return `${sym}${rounded.toLocaleString()}`;
    };
    return `≈ ${conv(draft.budget[0])} – ${conv(draft.budget[1])}`;
  }, [dest, rate, draft.budget]);

  if (!dest) return <Navigate to="/" replace />;

  const canSubmit = draft.styles.length > 0 && draft.endDate >= draft.startDate;

  const panel = (
    <form
      className={styles.panel}
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) navigate('/generating');
      }}
      aria-describedby={!canSubmit ? 'form-hint' : undefined}
    >
      <PanelHeader
        step={2}
        total={3}
        stepLabel="CONDITIONS"
        size="md"
        title={`${dest.name} 여행, 조건을 알려주세요`}
        top={
          <div className={styles.top}>
            <button type="button" className={styles.back} onClick={() => navigate('/')}>
              <ArrowLeft size={16} aria-hidden /> 여행지
            </button>
            <StepProgress current={2} total={3} />
          </div>
        }
      />

      <div className={styles.scroll}>
        <fieldset className={styles.section}>
          <legend className={styles.legend}>
            여행 날짜 <span className={styles.pill}>{formatStay(draft.startDate, draft.endDate)}</span>
          </legend>
          <DateRangeField
            start={draft.startDate}
            end={draft.endDate}
            onChange={(startDate, endDate) => dispatch({ type: 'setDates', startDate, endDate })}
          />
        </fieldset>

        <fieldset className={styles.section}>
          <legend className={styles.legend}>인원</legend>
          <div className={styles.people}>
            <Counter label="성인" description="만 13세 이상" value={draft.adults} min={1} onChange={(v) => dispatch({ type: 'setPeople', key: 'adults', value: v })} />
            <Counter label="아동" description="만 12세 이하" value={draft.children} onChange={(v) => dispatch({ type: 'setPeople', key: 'children', value: v })} />
          </div>
        </fieldset>

        <fieldset className={styles.section}>
          <legend className={styles.legend}>
            <span>
              1인 예산 <span className={styles.hint}>항공권 제외</span>
            </span>
            <span className={styles.legendValue} aria-live="polite">
              {formatManwon(draft.budget[0])} – {formatManwon(draft.budget[1])}원
            </span>
          </legend>
          <BudgetRange value={draft.budget} onChange={(budget) => dispatch({ type: 'setBudget', budget })} />
          {foreignBudget && (
            <p className={styles.fx}>
              <strong>{foreignBudget}</strong> · {rateLabel(rate)}
            </p>
          )}
        </fieldset>

        <fieldset className={styles.section}>
          <legend className={styles.legend}>
            여행 스타일 <span className={styles.hint}>복수 선택</span>
          </legend>
          <div className={styles.styles}>
            {TRAVEL_STYLES.map((s) => (
              <Chip
                key={s.id}
                selected={draft.styles.includes(s.id)}
                onClick={() => dispatch({ type: 'toggleStyle', style: s.id })}
                icon={<SmartImage src={s.icon} alt="" blend className={styles.styleIcon} />}
              >
                {s.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className={styles.section}>
          <Textarea
            label="피오에게 부탁할 것 (선택)"
            className={styles.request}
            placeholder="예) 부모님과 함께라 많이 걷지 않는 일정이면 좋겠어요. 저녁은 현지인 맛집 위주로!"
            value={draft.request}
            onChange={(e) => dispatch({ type: 'setRequest', request: e.target.value })}
          />
        </div>
      </div>

      {!canSubmit && (
        <p id="form-hint" className={styles.formHint} role="status">
          여행 스타일을 하나 이상 골라주세요
        </p>
      )}
      <div className="mobile-sticky-cta">
        <Button type="submit" variant="primary" fullWidth disabled={!canSubmit}>
          피오에게 일정 부탁하기
        </Button>
      </div>
    </form>
  );

  const map = (
    <>
      <BaseMap center={[dest.lat, dest.lng]} zoom={12} label={`${dest.name} 지도`} zoomPosition="bottomright">
        <Marker position={[dest.lat, dest.lng]} icon={destinationIcon(dest, true)} interactive={false} />
      </BaseMap>
      <TripSummary destination={dest} draft={draft} />
      <p className={styles.mapHint}>
        조건과 부탁을 바탕으로 피오가 날씨·동선을 고려해 일정을 짜요
      </p>
    </>
  );

  return <SplitView panel={panel} map={map} panelLabel="여행 조건 입력" />;
}
