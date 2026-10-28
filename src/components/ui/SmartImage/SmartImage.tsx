import { useState, type ImgHTMLAttributes } from 'react';
import clsx from 'clsx';
import styles from './SmartImage.module.scss';

interface SmartImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** 이미지가 없을 때 보여줄 부드러운 배경 */
  fallback?: string;
  /** 흰 배경 3D 아이콘을 카드 배경에 자연스럽게 섞을 때 */
  blend?: boolean;
}

/** 지연 로딩 + 로드 실패 시 그라데이션 대체 */
export function SmartImage({ fallback, blend, className, alt = '', loading = 'lazy', ...rest }: SmartImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        className={clsx(styles.fallback, className)}
        style={{ background: fallback ?? 'linear-gradient(135deg, var(--sky-50), var(--primary-50))' }}
      />
    );
  }
  return (
    <img
      alt={alt}
      loading={loading}
      decoding="async"
      className={clsx(blend && styles.blend, className)}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
