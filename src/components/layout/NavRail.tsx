import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { BarChart3, Bookmark, CalendarDays, Map, SlidersHorizontal } from 'lucide-react';
import { Logo } from './Logo';
import styles from './NavRail.module.scss';

/** match: 이 메뉴가 선택된 것으로 볼 경로들 (여행 만들기 흐름은 '여행지 탐색'에 포함) */
export const NAV = [
  { to: '/', label: '여행지 탐색', short: '탐색', icon: Map, match: ['/', '/conditions', '/generating'] },
  { to: '/plan', label: '일정', short: '일정', icon: CalendarDays, match: ['/plan'] },
  { to: '/overview', label: '내 여행 한눈에', short: '한눈에', icon: BarChart3, match: ['/overview'] },
  { to: '/trips', label: '내 여행', short: '내 여행', icon: Bookmark, match: ['/trips'] },
];

export function NavRail() {
  const { pathname } = useLocation();
  return (
    <nav className={styles.rail} aria-label="주요 메뉴">
      <Link to="/" aria-label="Trippio 홈">
        <Logo />
      </Link>
      <ul className={styles.list}>
        {NAV.map(({ to, label, icon: Icon, match }) => {
          const active = match.includes(pathname);
          return (
            <li key={to}>
              <Link
                to={to}
                aria-label={label}
                title={label}
                aria-current={active ? 'page' : undefined}
                className={clsx(styles.item, active && styles.active)}
              >
                <Icon size={20} strokeWidth={2} />
              </Link>
            </li>
          );
        })}
      </ul>
      <div className={styles.bottom}>
        <button type="button" className={styles.item} aria-label="설정">
          <SlidersHorizontal size={20} />
        </button>
        <span className={styles.avatar} aria-label="내 계정">YJ</span>
      </div>
    </nav>
  );
}
