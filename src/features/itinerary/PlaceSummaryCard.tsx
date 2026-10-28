import { ChevronRight } from 'lucide-react';
import { SmartImage } from '@/components/ui';
import { AiReason } from './AiReason';
import type { Place, Stop } from '@/types/itinerary';
import styles from './PlaceSummaryCard.module.scss';

interface Props {
  order: number;
  stop: Stop;
  place: Place;
  onOpen: () => void;
}

export function PlaceSummaryCard({ order, stop, place, onOpen }: Props) {
  return (
    <aside className={styles.card} aria-label={`${place.name} 요약`}>
      <SmartImage src={place.image} alt="" className={styles.image} />
      <div className={styles.content}>
        <p className={styles.overline}>
          STOP {String(order).padStart(2, '0')} — {stop.start}
        </p>
        <h2 className={styles.name}>{place.name}</h2>
        <p className={styles.desc}>{place.description}</p>
        <AiReason reasons={stop.reasons.slice(0, 3)} />
        <button type="button" className={styles.more} onClick={onOpen}>
          자세히 보기 <ChevronRight size={14} aria-hidden />
        </button>
      </div>
    </aside>
  );
}
