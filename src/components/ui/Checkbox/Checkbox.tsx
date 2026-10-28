import { useId, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import styles from './Checkbox.module.scss';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export function Checkbox({ label, className, id, ...rest }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={clsx(styles.root, className)}>
      <input id={inputId} type="checkbox" className={styles.input} {...rest} />
      <span className={styles.box} aria-hidden>
        <Check size={12} strokeWidth={3} />
      </span>
      <span className={styles.label}>{label}</span>
    </label>
  );
}
