import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Button.module.scss';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary는 화면(폼)당 최종 액션 1개에만 사용해요 */
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', leftIcon, rightIcon, fullWidth, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(styles.button, styles[variant], styles[size], fullWidth && styles.full, className)}
      {...rest}
    >
      {leftIcon && <span className={styles.icon} aria-hidden>{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className={styles.icon} aria-hidden>{rightIcon}</span>}
    </button>
  );
});
