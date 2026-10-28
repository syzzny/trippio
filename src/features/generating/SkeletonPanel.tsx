import styles from './SkeletonPanel.module.scss';

/** 일정 결과 패널과 같은 모양의 로딩 자리 */
export function SkeletonPanel({ dimmed }: { dimmed?: boolean }) {
  return (
    <div className={styles.root} aria-hidden data-dimmed={dimmed || undefined}>
      <div className={styles.stats}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={styles.col}>
            <span className={styles.bone} style={{ width: 56, height: 10 }} />
            <span className={styles.bone} style={{ width: 80, height: 16 }} />
          </span>
        ))}
      </div>
      <div className={styles.tabs}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={styles.tab}>
            <span className={styles.bone} style={{ width: 36, height: 8 }} />
            <span className={styles.bone} style={{ width: 48, height: 10 }} />
          </span>
        ))}
      </div>
      <ul className={styles.list}>
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className={styles.item} style={{ opacity: 1 - i * 0.17 }}>
            <span className={styles.bone} style={{ width: 30, height: 30, borderRadius: 15 }} />
            <span className={styles.bone} style={{ width: 56, height: 56, borderRadius: 12 }} />
            <span className={styles.lines}>
              <span className={styles.bone} style={{ width: 70, height: 8 }} />
              <span className={styles.bone} style={{ width: 140 + (i % 3) * 20, height: 13 }} />
              <span className={styles.bone} style={{ width: 90, height: 9 }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
