import { Check, Plane, Sun } from 'lucide-react';
import clsx from 'clsx';
import { SmartImage } from '@/components/ui';
import type { Destination } from '@/types/trip';
import styles from './DestinationCard.module.scss';

interface Props {
  destination: Destination;
  selected: boolean;
  onSelect: () => void;
  tabIndex: number;
}

export function DestinationCard({ destination: d, selected, onSelect, tabIndex }: Props) {
  return (
    <li>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        tabIndex={tabIndex}
        className={clsx(styles.card, selected && styles.selected)}
        onClick={onSelect}
      >
        <SmartImage src={d.image} alt="" className={styles.thumb} />
        <span className={styles.info}>
          <span className={styles.nameRow}>
            <span className={styles.name}>{d.name}</span>
            <span className={styles.en}>{d.country}</span>
          </span>
          <span className={styles.tagline}>{d.tagline}</span>
          <span className={styles.meta}>
            <Sun size={12} color="var(--sun-500)" aria-hidden />
            11월 평균 {d.climate.high}°
            {d.flightTime && (
              <>
                <span aria-hidden>·</span>
                <Plane size={12} aria-hidden />
                <span>{d.flightTime}</span>
              </>
            )}
          </span>
        </span>
        <span className={styles.radio} aria-hidden>
          {selected && <Check size={14} strokeWidth={2.6} />}
        </span>
      </button>
    </li>
  );
}
