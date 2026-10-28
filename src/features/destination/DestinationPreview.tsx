import { SmartImage } from '@/components/ui';
import { rateLabel, rateShortLabel, useExchangeRate } from '@/api/exchange';
import { CURRENCY_UNIT, CURRENCY_NAME } from '@/lib/format';
import type { Destination } from '@/types/trip';
import styles from './DestinationPreview.module.scss';

export function DestinationPreview({ destination: d }: { destination: Destination }) {
  const { data: rate, isPending } = useExchangeRate(d.currency);
  const unit = CURRENCY_UNIT[d.currency] ?? 1;

  const rateText =
    d.currency === 'KRW'
      ? '원화 사용'
      : isPending || !rate
        ? '불러오는 중…'
        : `${unit}${CURRENCY_NAME[d.currency] ?? d.currency} ≈ ${Math.round(rate.krwPerUnit * unit).toLocaleString('ko-KR')}원`;

  return (
    <aside className={styles.card} aria-label={`${d.name} 미리보기`}>
      <div className={styles.top}>
        <SmartImage src={d.image} alt="" className={styles.image} />
        <div className={styles.text}>
          <p className={styles.overline}>
            {d.nameEn} · {d.country}
          </p>
          <h2 className={styles.name}>{d.name}</h2>
          <p className={styles.desc}>{d.description}</p>
        </div>
      </div>
      <dl className={styles.stats}>
        <div>
          <dt>11월 평균</dt>
          <dd>{d.climate.high}°</dd>
        </div>
        <div>
          <dt>{d.flightTime ? '비행' : '추천 일정'}</dt>
          <dd>{d.flightTime ?? d.recommendedStay}</dd>
        </div>
        <div>
          <dt title={rateLabel(rate)}>{d.currency === 'KRW' ? '환율' : rateShortLabel(rate)}</dt>
          <dd aria-live="polite">{rateText}</dd>
        </div>
      </dl>
    </aside>
  );
}
