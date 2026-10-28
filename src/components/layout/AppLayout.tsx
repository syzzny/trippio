import { Outlet } from 'react-router-dom';
import { NavRail } from './NavRail';
import { MobileTabBar } from './MobileTabBar';
import styles from './AppLayout.module.scss';

export function AppLayout() {
  return (
    <div className={styles.app}>
      <a href="#main" className={styles.skip}>본문으로 건너뛰기</a>
      <NavRail />
      <main id="main" className={styles.main}>
        <Outlet />
      </main>
      <MobileTabBar />
    </div>
  );
}
