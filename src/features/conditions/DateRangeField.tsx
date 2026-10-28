import { useId } from 'react';
import { CalendarDays } from 'lucide-react';
import { addDays, formatShort, todayISO } from '@/lib/date';
import styles from './DateRangeField.module.scss';

interface Props {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}

export function DateRangeField({ start, end, onChange }: Props) {
  const id = useId();
  const today = todayISO();

  const changeStart = (value: string) => {
    if (!value) return;
    // 가는 날이 오는 날보다 늦어지면 오는 날을 같이 밀어줘요
    onChange(value, value > end ? addDays(value, 1) : end);
  };

  return (
    <div className={styles.row}>
      {[
        { key: 'start', label: '가는 날', value: start, min: today, set: changeStart },
        { key: 'end', label: '오는 날', value: end, min: start, set: (v: string) => v && onChange(start, v) },
      ].map((f) => (
        <label key={f.key} htmlFor={`${id}-${f.key}`} className={styles.field}>
          <CalendarDays size={16} aria-hidden className={styles.icon} />
          <span className={styles.text}>
            <span className={styles.label}>{f.label}</span>
            <span className={styles.value} aria-hidden>{formatShort(f.value)}</span>
          </span>
          <input
            id={`${id}-${f.key}`}
            type="date"
            className={styles.input}
            value={f.value}
            min={f.min}
            aria-label={f.label}
            onChange={(e) => f.set(e.target.value)}
          />
        </label>
      ))}
    </div>
  );
}
