import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import styles from './Chip.module.scss';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  selected?: boolean;
  /** pill: 지도 위 필터 / rounded: 폼 안 선택지 */
  shape?: 'pill' | 'rounded';
  dotColor?: string;
  icon?: ReactNode;
  showCheck?: boolean;
}

/** 선택 상태는 무채색으로만 표현해요 (포인트 색 X) */
export function Chip({ selected, shape = 'rounded', dotColor, icon, showCheck, className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={clsx(styles.chip, styles[shape], selected && styles.selected, className)}
      {...rest}
    >
      {showCheck && selected && <Check size={14} strokeWidth={2.6} aria-hidden />}
      {icon}
      {dotColor && !icon && <span className={styles.dot} style={{ background: dotColor }} aria-hidden />}
      <span>{children}</span>
    </button>
  );
}
