import { useId, useMemo } from 'react';
import clsx from 'clsx';
import { formatManwon } from '@/lib/format';
import styles from './BudgetRange.module.scss';

const MIN = 100_000;
const MAX = 1_000_000;
const STEP = 50_000;
const BARS = 24;

interface Props {
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const pct = (v: number) => ((v - MIN) / (MAX - MIN)) * 100;

/** 비슷한 여행자 예산 분포(목업) 위에 두 개의 range input을 겹친 이중 슬라이더 */
export function BudgetRange({ value, onChange }: Props) {
  const id = useId();
  const [lo, hi] = value;
  const bars = useMemo(
    () =>
      Array.from({ length: BARS }, (_, i) => {
        const v = MIN + ((i + 0.5) / BARS) * (MAX - MIN);
        return { v, h: 14 + 86 * Math.exp(-(((v - 450_000) / 180_000) ** 2)) };
      }),
    [],
  );

  return (
    <div className={styles.root}>
      <div className={styles.histogram} aria-hidden>
        {bars.map((b, i) => (
          <span key={i} className={clsx(styles.bar, b.v >= lo && b.v <= hi && styles.inRange)} style={{ height: `${b.h}%` }} />
        ))}
      </div>

      <div className={styles.slider}>
        <div className={styles.track} />
        <div className={styles.fill} style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          id={`${id}-min`}
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={lo}
          aria-label="최소 예산"
          aria-valuetext={`${formatManwon(lo)}원`}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi - STEP), hi])}
          className={styles.thumb}
        />
        <input
          id={`${id}-max`}
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={hi}
          aria-label="최대 예산"
          aria-valuetext={`${formatManwon(hi)}원`}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + STEP)])}
          className={styles.thumb}
        />
      </div>

      <div className={styles.scale} aria-hidden>
        <span>10만</span>
        <span>100만+</span>
      </div>
    </div>
  );
}
