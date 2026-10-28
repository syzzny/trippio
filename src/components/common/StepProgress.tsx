import styles from './StepProgress.module.scss';

export function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div
      className={styles.bar}
      role="progressbar"
      aria-label="진행 단계"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={`${total}단계 중 ${current}단계`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < current ? styles.on : styles.off} />
      ))}
    </div>
  );
}
