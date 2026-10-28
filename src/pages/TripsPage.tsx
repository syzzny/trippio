import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { Button, SegmentedTabs, SmartImage } from '@/components/ui';
import { PastTripRow, RecommendCard, TripCard } from '@/features/trips/TripCards';
import { useOpenTrip } from '@/features/trips/useOpenTrip';
import { DESTINATIONS, getDestination } from '@/data/destinations';
import { getMockPlaces } from '@/data/places';
import { diffDays, todayISO } from '@/lib/date';
import { daySpend } from '@/lib/planner';
import { useItinerary } from '@/store/ItineraryContext';
import { useTripDraft } from '@/store/TripDraftContext';
import { tripEnd, tripStart, tripsStore, useTrips, type SavedTrip } from '@/store/trips';
import type { Place } from '@/types/itinerary';
import styles from './TripsPage.module.scss';

type Tab = 'upcoming' | 'past';

/** 저장할 때 함께 담아 둔 장소로 1인 예상 경비를 계산해요 */
const tripSpend = (trip: SavedTrip) => {
  const it = trip.itinerary;
  const map = new Map<string, Place>([...getMockPlaces(it.destinationId), ...trip.places].map((p) => [p.id, p]));
  return it.lodgingPerPerson + it.days.reduce((s, d) => s + daySpend(d, (id) => map.get(id) ?? null), 0);
};

export default function TripsPage() {
  const navigate = useNavigate();
  const trips = useTrips();
  const openTrip = useOpenTrip();
  const { itinerary, setItinerary } = useItinerary();
  const { dispatch } = useTripDraft();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [undo, setUndo] = useState<{ trip: SavedTrip; wasCurrent: boolean } | null>(null);

  const today = todayISO();
  const { upcoming, past } = useMemo(() => {
    const sorted = [...trips].sort((a, b) => tripStart(a.itinerary).localeCompare(tripStart(b.itinerary)));
    return {
      upcoming: sorted.filter((t) => diffDays(today, tripEnd(t.itinerary)) >= 0),
      past: sorted.filter((t) => diffDays(today, tripEnd(t.itinerary)) < 0).reverse(),
    };
  }, [trips, today]);

  // 가장 가까운 여행(없으면 최근 여행)과 테마가 겹치는 여행지를 추천해요
  const base = getDestination((upcoming[0] ?? past[0])?.itinerary.destinationId ?? null);
  const recommends = useMemo(() => {
    if (!base) return [];
    const taken = new Set(trips.map((t) => t.itinerary.destinationId));
    return DESTINATIONS.filter((d) => !taken.has(d.id))
      .map((d) => ({
        d,
        // 해외/국내가 같은 곳 → 테마가 겹치는 곳 → 인기 순
        score: (d.region === base.region ? 30 : 0) + d.themes.filter((t) => base.themes.includes(t)).length * 20 + d.popularity / 10,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.d);
  }, [base, trips]);

  const remove = (trip: SavedTrip) => {
    const wasCurrent = itinerary?.id === trip.id;
    tripsStore.remove(trip.id);
    // 지금 열려 있는 일정을 지우면 일정 화면도 비워요 (그대로 두면 편집할 때 다시 저장돼요)
    if (wasCurrent) setItinerary(null);
    setUndo({ trip, wasCurrent });
    window.setTimeout(() => setUndo((u) => (u?.trip.id === trip.id ? null : u)), 5000);
  };

  const restore = () => {
    if (!undo) return;
    tripsStore.restore(undo.trip);
    if (undo.wasCurrent) setItinerary(undo.trip.itinerary);
    setUndo(null);
  };

  const startNew = () => {
    dispatch({ type: 'reset' });
    navigate('/');
  };

  const nextIn = upcoming[0] ? diffDays(today, tripStart(upcoming[0].itinerary)) : null;
  const list = tab === 'upcoming' ? upcoming : past;

  const toast = (
    <div className={styles.toast} role="status" aria-live="polite">
      {undo && (
        <>
          여행을 삭제했어요
          <button type="button" onClick={restore}>
            되돌리기
          </button>
        </>
      )}
    </div>
  );

  if (trips.length === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>내 여행</h1>
            <p className={styles.meta}>아직 저장한 여행이 없어요</p>
          </div>
        </header>
        <section className={styles.empty} aria-labelledby="trips-empty-title">
          <SmartImage src="/images/3d-empty-suitcase.jpg" alt="" blend className={styles.emptyImg} />
          <h2 id="trips-empty-title" className={styles.emptyTitle}>첫 여행을 계획해 볼까요?</h2>
          <p className={styles.emptyDesc}>여행지와 조건만 고르면 여행 친구 피오가 날씨와 동선까지 고려해 일정을 만들어 드려요</p>
          <div className={styles.emptyActions}>
            <Button variant="primary" onClick={startNew}>
              첫 여행 만들기
            </Button>
            <Button variant="secondary" onClick={() => navigate('/')}>
              인기 여행지 둘러보기
            </Button>
          </div>
        </section>
        {toast}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>내 여행</h1>
          <p className={styles.meta}>
            저장한 여행 {trips.length}개
            {nextIn !== null && (nextIn > 0 ? ` · 다음 여행까지 ${nextIn}일` : nextIn === 0 ? ' · 오늘 떠나요' : ' · 여행 중')}
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={startNew}>
          새 여행 만들기
        </Button>
      </header>

      <SegmentedTabs<Tab>
        variant="underline"
        label="여행 구분"
        value={tab}
        onChange={setTab}
        controls="trips-panel"
        items={[
          { value: 'upcoming', label: '예정된 여행', badge: upcoming.length },
          { value: 'past', label: '지난 여행', badge: past.length },
        ]}
      />

      <section id="trips-panel" role="tabpanel" aria-label={tab === 'upcoming' ? '예정된 여행' : '지난 여행'}>
        {list.length ? (
          <ul className={styles.grid}>
            {list.map((trip, i) => (
              <li key={trip.id}>
                <TripCard trip={trip} tone={i} onOpen={() => openTrip(trip)} onRemove={() => remove(trip)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.none}>
            {tab === 'upcoming' ? '예정된 여행이 없어요. 새 여행을 만들어 보세요.' : '아직 다녀온 여행이 없어요.'}
          </p>
        )}
      </section>

      {tab === 'upcoming' && recommends.length > 0 && base && (
        <section aria-labelledby="rec-title">
          <div className={styles.sectionHead}>
            <h2 id="rec-title" className={styles.sectionTitle}>다음 여행은 어디로? 피오의 추천</h2>
            <span className={styles.sectionNote}>{base.name} 여행 스타일과 비슷한 곳이에요</span>
          </div>
          <ul className={styles.recs}>
            {recommends.map((d) => (
              <li key={d.id}>
                <RecommendCard
                  dest={d}
                  onSelect={() => {
                    dispatch({ type: 'selectDestination', id: d.id });
                    navigate('/conditions');
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'upcoming' && past.length > 0 && (
        <section aria-labelledby="past-title">
          <div className={styles.sectionHead}>
            <h2 id="past-title" className={styles.sectionTitle}>최근 다녀온 여행</h2>
            <button type="button" className={styles.more} onClick={() => setTab('past')}>
              전체 보기 <ChevronRight size={14} aria-hidden />
            </button>
          </div>
          <div className={styles.pastList}>
            {past.slice(0, 2).map((t) => (
              <PastTripRow key={t.id} trip={t} spend={tripSpend(t)} onOpen={() => openTrip(t, '/overview')} />
            ))}
          </div>
        </section>
      )}

      {toast}
    </div>
  );
}
