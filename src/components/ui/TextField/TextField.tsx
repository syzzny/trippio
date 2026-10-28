import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './TextField.module.scss';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  /** 시각적으로 라벨을 숨기되 스크린리더에는 읽혀요 */
  hideLabel?: boolean;
  icon?: ReactNode;
  error?: string;
  helper?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hideLabel, icon, error, helper, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = `${inputId}-desc`;
  return (
    <div className={clsx(styles.root, className)}>
      <label htmlFor={inputId} className={clsx(styles.label, hideLabel && styles.hidden)}>
        {label}
      </label>
      <div className={clsx(styles.field, error && styles.error, rest.disabled && styles.disabled)}>
        {icon && <span className={styles.icon} aria-hidden>{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={styles.input}
          aria-invalid={!!error || undefined}
          aria-describedby={error || helper ? descId : undefined}
          {...rest}
        />
      </div>
      {(error || helper) && (
        <p id={descId} className={clsx(styles.desc, error && styles.descError)}>
          {error ?? helper}
        </p>
      )}
    </div>
  );
});
