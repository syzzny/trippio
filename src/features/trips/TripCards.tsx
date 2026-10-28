import clsx from 'clsx';
import { ChevronRight, Trash2 } from 'lucide-react';
import { SmartImage } from '@/components/ui';
import { getDestination } from '@/data/destinations';
import { diffDays, formatShort, formatStay, parseISODate, todayISO, weekday } from '@/lib/date';
import { formatManwon } from '@/lib/format';
import { buildChecklist, checklistKey } from '@/features/overview/checklist';
import { readChecked } from '@/features/overview/useChecklist';
import { tripEnd, tripStart, type SavedTrip } from '@/store/trips';
import type { Destination } from '@/types/trip';
import styles from './Trips.module.scss';

/** 카드 윗부분 3D 일러스트 — 여행지 성격에 맞춰 골라요 */
const tripArt = (d: Destination) => {
  if (d.id === 'osaka') return { src: '/images/3d-trip-hero.png', png: true };
  if (d.themes.includes('resort')) return { src: '/images/3d-globe.jpg', png: false };
  if (d.themes.includes('nature')) return { src: '/images/3d-nature.jpg', png: false };
  return { src: '/images/3d-culture.jpg', png: false };
};

/** 올해가 아니면 연도를 붙여요: 11.14 (토) / 2027.01.31 (일) */
export const dateLabel = (iso: string, withYear = false) => {
  const d = parseISODate(iso);
  if (!withYear && d.getFullYear() === new Date().getFullYear()) return formatShort(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${weekday(iso)})`;
};

export const ddayLabel = (start: string, end: string) => {
  const today = todayISO();
  const left = diffDays(today, start);
  if (left > 0) return `D-${left}`;
  if (left === 0) return 'D-DAY';
  return diffDays(today, end) >= 0 ? '여행 중' : '다녀옴';
};

const prepOf = (trip: SavedTrip) => {
  const items = buildChecklist(trip.itinerary);
  const checked = readChecked(checklistKey(trip.itinerary));
  return { done: items.filter((i) => checked.includes(i)).length, total: items.length };
};

interface TripCardProps {
  trip: SavedTrip;
  tone: number;
  onOpen: () => void;
  onRemove: () => void;
}

export function TripCard({ trip, tone, onOpen, onRemove }: TripCardProps) {
  const it = trip.itinerary;
  const dest = getDestination(it.destinationId);
  if (!dest) return null;
  const start = tripStart(it);
  const end = tripEnd(it);
  const title = `${dest.name} ${formatStay(start, end)}`;
  const art = tripArt(dest);
  const prep = prepOf(trip);
  const pct = prep.total ? Math.round((prep.done / prep.total) * 100) : 0;
  const titleId = `trip-${trip.id}`;

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <div className={clsx(styles.cover, styles[`tone${tone % 3}`])}>
        <span className={styles.dday}>{ddayLabel(start, end)}</span>
        <SmartImage src={art.src} alt="" blend={!art.png} className={styles.coverArt} />
      </div>
      <div className={styles.body}>
        <h2 id={titleId} className={styles.title}>
          {/* 카드 전체를 누를 수 있게 제목 링크를 카드 크기로 늘려요 */}
          <button type="button" className={styles.stretch} onClick={onOpen}>
            {title}
          </button>
          <span className={styles.aiChip}>피오 추천</span>
        </h2>
        <p className={styles.dates}>
          {dateLabel(start)} – {dateLabel(end)}
        </p>
        <p className={styles.meta}>
          성인 {it.adults ?? 2}명{it.children ? ` · 아동 ${it.children}명` : ''} · 1인 {formatManwon(it.budget[1])}원
        </p>
        <div className={styles.prep}>
          <span className={styles.prepTrack} aria-hidden>
            <span style={{ width: `${pct}%` }} />
          </span>
          <span>{prep.done ? `준비 ${prep.done}/${prep.total}` : '준비 시작 전'}</span>
        </div>
      </div>
      <button type="button" className={styles.remove} onClick={onRemove} aria-label={`${title} 삭제`} title="여행 삭제">
        <Trash2 size={16} />
      </button>
    </article>
  );
}

export function RecommendCard({ dest, onSelect }: { dest: Destination; onSelect: () => void }) {
  return (
    <button type="button" className={styles.rec} onClick={onSelect}>
      <SmartImage src={dest.image} alt="" className={styles.recImg} />
      <span className={styles.recText}>
        <b>{dest.name}</b>
        <span>
          {dest.tagline.split(' · ').slice(0, 2).join(' · ')}
          {dest.flightTime ? ` · 비행 ${dest.flightTime}` : ''}
        </span>
      </span>
      <ChevronRight size={16} aria-hidden className={styles.recArrow} />
    </button>
  );
}

export function PastTripRow({ trip, spend, onOpen }: { trip: SavedTrip; spend: number; onOpen: () => void }) {
  const it = trip.itinerary;
  const dest = getDestination(it.destinationId);
  if (!dest) return null;
  const start = tripStart(it);
  const end = tripEnd(it);
  const stops = it.days.reduce((n, d) => n + d.stops.length, 0);
  return (
    <div className={styles.past}>
      <SmartImage src={dest.image} alt="" className={styles.pastImg} />
      <div className={styles.pastText}>
        <b>
          {dest.name} {formatStay(start, end)}
        </b>
        <span>
          {dateLabel(start, true)} – {formatShort(end)} · 방문 {stops}곳 · 1인 예상{' '}
          {(spend / 10_000).toFixed(1)}만원
        </span>
      </div>
      <button type="button" className={styles.pastBtn} onClick={onOpen}>
        여행 기록 보기
      </button>
    </div>
  );
}
