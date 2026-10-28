import styles from './AiReason.module.scss';

export function AiReason({ reasons, title }: { reasons: string[]; title?: string }) {
  return (
    <div className={styles.box}>
      {title && (
        <p className={styles.title}>
          <img src="/images/3d-pio-face.jpg" alt="" className={styles.face} />
          {title}
        </p>
      )}
      <p className={styles.text}>
        {reasons.join(' · ')}
      </p>
    </div>
  );
}
