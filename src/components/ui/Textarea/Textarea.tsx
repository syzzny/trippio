import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';
import styles from './Textarea.module.scss';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hideLabel?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hideLabel, maxLength = 200, value = '', className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const count = String(value).length;
  return (
    <div className={clsx(styles.root, className)}>
      <label htmlFor={inputId} className={clsx(hideLabel && styles.hidden)}>
        {label}
      </label>
      <div className={styles.field}>
        <textarea
          ref={ref}
          id={inputId}
          className={styles.input}
          value={value}
          maxLength={maxLength}
          aria-describedby={`${inputId}-count`}
          {...rest}
        />
        <span id={`${inputId}-count`} className={styles.count} aria-live="polite">
          {count} / {maxLength}
        </span>
      </div>
    </div>
  );
});
