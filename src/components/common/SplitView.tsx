import type { ReactNode } from 'react';
import clsx from 'clsx';
import styles from './SplitView.module.scss';

interface Props {
  panel: ReactNode;
  map: ReactNode;
  panelLabel: string;
  /** 모바일에서 지도 영역 높이: fixed(화면의 46%) / content(지도 위에 띄운 내용만큼 늘어남) */
  mobileMap?: 'fixed' | 'content';
}

/** 왼쪽 패널 + 오른쪽 지도 레이아웃 (01·02·03·04 화면 공통). 모바일은 위 지도 + 아래 시트 */
export function SplitView({ panel, map, panelLabel, mobileMap = 'fixed' }: Props) {
  return (
    <div className={styles.split}>
      <section className={styles.panel} aria-label={panelLabel}>
        {panel}
      </section>
      <div className={clsx(styles.map, mobileMap === 'content' && styles.mapContent)}>{map}</div>
    </div>
  );
}
