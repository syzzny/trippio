import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { NAV } from './NavRail';
import styles from './MobileTabBar.module.scss';

/** 모바일 하단 탭 바 — 데스크톱의 왼쪽 메뉴(NavRail)와 같은 메뉴를 보여줘요 */
export function MobileTabBar() {
  const { pathname } = useLocation();
  return (
    <nav className={styles.bar} aria-label="주요 메뉴">
      <ul className={styles.list}>
        {NAV.map(({ to, label, short, icon: Icon, match }) => {
          const active = match.includes(pathname);
          return (
            <li key={to}>
              <Link
                to={to}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={clsx(styles.item, active && styles.active)}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                <span aria-hidden>{short}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
