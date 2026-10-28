import { useRef, type KeyboardEvent } from 'react';
import clsx from 'clsx';
import styles from './SegmentedTabs.module.scss';

export interface SegmentedTabItem<T extends string> {
  value: T;
  label: string;
  /** 탭 옆 보조 숫자 (예: 여행지 개수) */
  badge?: string | number;
  sub?: string;
}

interface Props<T extends string> {
  items: SegmentedTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  /** 탭 버튼과 연결할 패널 id */
  controls?: string;
  /** pill: 회색 바탕 위 흰 알약 (기본) / underline: 페이지 상단 밑줄 탭 */
  variant?: 'pill' | 'underline';
}

/** WAI-ARIA tabs 패턴: 좌우 화살표로 이동 */
export function SegmentedTabs<T extends string>({ items, value, onChange, label, className, controls, variant = 'pill' }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    refs.current[next]?.focus();
    onChange(items[next].value);
  };

  return (
    <div role="tablist" aria-label={label} className={clsx(styles.tabs, variant === 'underline' && styles.underline, className)}>
      {items.map((item, i) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => (refs.current[i] = el)}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={controls}
            tabIndex={active ? 0 : -1}
            className={clsx(styles.tab, active && styles.active)}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {item.sub ? (
              <>
                <span className={styles.sub}>{item.label}</span>
                <span className={styles.main}>{item.sub}</span>
              </>
            ) : (
              <>
                <span>{item.label}</span>
                {item.badge !== undefined && <span className={styles.badge}>{item.badge}</span>}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
