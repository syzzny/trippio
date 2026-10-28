import { Minus, Plus } from 'lucide-react';
import styles from './Counter.module.scss';

interface CounterProps {
  label: string;
  description?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function Counter({ label, description, value, min = 0, max = 9, onChange }: CounterProps) {
  return (
    <div className={styles.root} role="group" aria-label={label}>
      <div className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description && <span className={styles.desc}>{description}</span>}
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.btn}
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`${label} 줄이기`}
        >
          <Minus size={14} />
        </button>
        <output className={styles.value} aria-live="polite">{value}</output>
        <button
          type="button"
          className={styles.btn}
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={`${label} 늘리기`}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
