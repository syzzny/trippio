import type { ReactNode } from 'react';
import styles from './PanelHeader.module.scss';

interface Props {
  step: number;
  total: number;
  stepLabel: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  top?: ReactNode;
  size?: 'lg' | 'md';
}

export function PanelHeader({ step, total, stepLabel, title, description, aside, top, size = 'lg' }: Props) {
  return (
    <header className={styles.header}>
      {top}
      <div className={styles.row}>
        <div className={styles.text}>
          <p className={styles.overline}>
            STEP {step} / {total} · {stepLabel}
          </p>
          <h1 className={size === 'md' ? styles.titleMd : styles.title}>{title}</h1>
          {description && <p className={styles.desc}>{description}</p>}
        </div>
        {aside}
      </div>
    </header>
  );
}
