import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import { GripVertical, Trash2 } from 'lucide-react';
import { SmartImage } from '@/components/ui';
import { CATEGORY_COLOR, CATEGORY_LABEL } from '@/data/places';
import { formatDuration, toMinutes } from '@/lib/time';
import type { Place, Stop } from '@/types/itinerary';
import styles from './StopCard.module.scss';

interface Props {
  order: number;
  stop: Stop;
  place: Place;
  active: boolean;
  editing: boolean;
  onSelect: () => void;
  onRemove: () => void;
  dragging?: boolean;
  /** dnd-kit이 넘겨주는 드래그 핸들 속성 */
  handleProps?: HTMLAttributes<HTMLButtonElement>;
  style?: React.CSSProperties;
}

export const StopCard = forwardRef<HTMLLIElement, Props>(function StopCard(
  { order, stop, place, active, editing, onSelect, onRemove, dragging, handleProps, style },
  ref,
) {
  const minutes = toMinutes(stop.end) - toMinutes(stop.start);
  return (
    <li ref={ref} style={style} className={clsx(styles.card, editing && styles.compact, active && styles.active, dragging && styles.dragging)}>
      <button
        type="button"
        className={styles.main}
        onClick={onSelect}
        aria-current={active ? 'true' : undefined}
      >
        <span className={styles.order} aria-hidden>
          {order}
        </span>
        <span className="sr-only">{order}번째 장소, </span>
        {!editing && <SmartImage src={place.image} alt="" className={styles.thumb} />}
        <span className={styles.info}>
          <span className={styles.time}>
            {stop.start} — {stop.end}
          </span>
          <span className={styles.name}>{place.name}</span>
          {!editing && (
            <span className={styles.meta}>
              <span className={styles.dot} style={{ background: CATEGORY_COLOR[place.category] }} aria-hidden />
              <span className={styles.cat}>{CATEGORY_LABEL[place.category]}</span>
              <span>· {formatDuration(minutes)}</span>
            </span>
          )}
        </span>
      </button>
      {editing ? (
        <span className={styles.tools}>
          <button type="button" className={styles.tool} onClick={onRemove} aria-label={`${place.name} 일정에서 빼기`}>
            <Trash2 size={16} />
          </button>
          <button type="button" className={clsx(styles.tool, styles.handle)} aria-label={`${place.name} 순서 바꾸기`} {...handleProps}>
            <GripVertical size={18} />
          </button>
        </span>
      ) : null}
    </li>
  );
});
