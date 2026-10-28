import { Footprints, TrainFront } from 'lucide-react';
import { formatDuration } from '@/lib/time';
import type { Leg } from '@/types/itinerary';
import styles from './LegRow.module.scss';

/** 장소 사이 이동 구간. 다음 일정까지 시간이 많이 남으면 자유 시간도 함께 보여줘요 */
export function LegRow({ leg, freeMinutes }: { leg: Leg; freeMinutes: number }) {
  const Icon = leg.mode === 'walk' ? Footprints : TrainFront;
  return (
    <li className={styles.row} aria-label={`${leg.mode === 'walk' ? '도보' : '대중교통'} ${leg.minutes}분 ${leg.km}킬로미터`}>
      <span className={styles.line} aria-hidden />
      <span className={styles.text} aria-hidden>
        <Icon size={13} />
        {leg.mode === 'walk' ? '도보' : '대중교통'} {leg.minutes}분 · {leg.km}km
        {freeMinutes >= 45 && <span className={styles.free}>· 자유 시간 {formatDuration(Math.round(freeMinutes / 5) * 5)}</span>}
      </span>
    </li>
  );
}
