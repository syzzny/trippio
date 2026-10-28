import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, PencilLine, RefreshCw } from 'lucide-react';
import { Button, SegmentedTabs, SmartImage } from '@/components/ui';
import { SplitView } from '@/components/common/SplitView';
import { EmptyTrip } from '@/components/common/EmptyTrip';
import { DayTimeline } from '@/features/itinerary/DayTimeline';
import { ItineraryMap } from '@/features/itinerary/ItineraryMap';
import { PlaceSummaryCard } from '@/features/itinerary/PlaceSummaryCard';
import { PlaceDrawer } from '@/features/itinerary/PlaceDrawer';
import { AddPlaceModal } from '@/features/itinerary/AddPlaceModal';
import { PioChat, type PioReply } from '@/features/itinerary/PioChat';
import { usePlaceLookup } from '@/features/itinerary/usePlaceLookup';
import { requestAiEdit } from '@/api/aiEdit';
import { weatherIcon, weatherLabel } from '@/features/conditions/weatherIcon';
import { getDestination } from '@/data/destinations';
import { useItinerary } from '@/store/ItineraryContext';
import { useTripDraft } from '@/store/TripDraftContext';
import { formatShort, formatStay, parseISODate, weekday } from '@/lib/date';
import { formatManwon } from '@/lib/format';
import { daySpend } from '@/lib/planner';
import { useIsMobile, useMediaQuery } from '@/hooks/useMediaQuery';
import styles from './PlanPage.module.scss';

type ModalState = { mode: 'add'; index: number } | { mode: 'replace'; stopId: string } | null;

export default function PlanPage() {
  const navigate = useNavigate();
  const { itinerary, setItinerary, moveStop, removeStop, insertPlace, replacePlace } = useItinerary();
  const { draft, dispatch } = useTripDraft();
  const dest = getDestination(itinerary?.destinationId ?? null);
  const placeOf = usePlaceLookup(itinerary?.destinationId);

  const location = useLocation();
  // 한눈에 보기에서 특정 날짜를 눌러 들어오면 그 날부터 보여줘요
  const initialDay = (location.state as { day?: number } | null)?.day ?? 0;
  const [dayIndex, setDayIndex] = useState(() => Math.min(initialDay, Math.max(0, (itinerary?.days.length ?? 1) - 1)));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const isMobile = useIsMobile();
  // 태블릿 이하에서는 지도 위 요약 카드가 없어서, 장소를 누르면 바로 상세를 열어요
  const compact = useMediaQuery('(max-width: 1024px)');
  const listRef = useRef<HTMLDivElement>(null);

  const day = itinerary?.days[dayIndex];

  // 날짜를 바꾸면 첫 장소를 선택하고, 선택한 장소가 사라지면 다시 첫 장소로
  useEffect(() => {
    if (!day) return;
    if (!day.stops.some((s) => s.id === selectedId)) setSelectedId(day.stops[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  // 지도에서 마커를 누르면 리스트의 해당 카드가 보이도록 스크롤
  useEffect(() => {
    if (!selectedId) return;
    listRef.current
      ?.querySelector(`[aria-current="true"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  const stats = useMemo(() => {
    if (!itinerary) return null;
    const stops = itinerary.days.reduce((n, d) => n + d.stops.length, 0);
    const km = itinerary.days.flatMap((d) => d.legs).reduce((s, l) => s + l.km, 0);
    const spend = itinerary.lodgingPerPerson + itinerary.days.reduce((s, d) => s + daySpend(d, placeOf), 0);
    return { stops, km, spend };
  }, [itinerary, placeOf]);

  // 아직 만든 일정이 없으면 빈 상태를 보여줘요
  if (!itinerary || !dest || !day || !stats) return <EmptyTrip />;

  const start = itinerary.days[0].date;
  const end = itinerary.days[itinerary.days.length - 1].date;
  const selectedIndex = day.stops.findIndex((s) => s.id === selectedId);
  const selectedStop = day.stops[selectedIndex];
  const selectedPlace = selectedStop ? placeOf(selectedStop.placeId) : null;

  /** 피오에게 수정 요청: 장소 순서만 피오(AI)가 바꾸고 시간표는 다시 계산해요. 실패하면 조건에 요청을 더해 새로 만들어요 */
  const askPio = async (text: string): Promise<PioReply | null> => {
    setAiBusy(true);
    try {
      const result = await requestAiEdit(itinerary, dest.name, text);
      if (result.changedDays.length === 0) {
        return { message: result.message || '어디를 바꾸면 좋을지 잘 모르겠어요. 날짜나 장소를 조금 더 알려 주실래요?' };
      }
      const before = itinerary;
      setItinerary(result.itinerary);
      dispatch({ type: 'setRequest', request: result.itinerary.request });
      setDayIndex(result.changedDays[0]);
      return { message: result.message || '말씀하신 대로 일정을 바꿨어요!', undo: () => setItinerary(before) };
    } catch {
      // 피오(AI)를 쓸 수 없으면(키 없음·오류) 요청을 조건에 더해 일정을 새로 만들어요
      dispatch({ type: 'setRequest', request: [draft.request.trim(), text].filter(Boolean).join(' ').slice(0, 200) });
      navigate('/generating');
      return null;
    } finally {
      setAiBusy(false);
    }
  };

  const modalAnchor = (() => {
    if (!modal) return null;
    if (modal.mode === 'replace') {
      const s = day.stops.find((x) => x.id === modal.stopId);
      return s ? placeOf(s.placeId) : null;
    }
    const prev = day.stops[modal.index - 1];
    return prev ? placeOf(prev.placeId) : null;
  })();

  const panel = (
    <div className={styles.panel}>
      {editing ? (
        // 편집 중에는 헤더를 한 줄로 접어 목록에 공간을 몰아줘요
        <header className={styles.headerCompact}>
          <h1 className={styles.titleCompact}>
            {dest.name} {formatStay(start, end)}
          </h1>
          <span className={styles.editingLabel}>편집 중 · 끌어서 순서를 바꿔요</span>
        </header>
      ) : (
        <header className={styles.header}>
          <div className={styles.topBar}>
            <p className={styles.overline}>
              {dest.nameEn} · {dest.country}
            </p>
            <div className={styles.topActions}>
              <button type="button" className={styles.back} onClick={() => navigate('/conditions')}>
                <ArrowLeft size={14} aria-hidden /> 조건 수정
              </button>
              <button type="button" className={styles.iconBtn} onClick={() => navigate('/generating')} aria-label="같은 조건으로 일정 다시 만들기" title="일정 다시 만들기">
                <RefreshCw size={15} />
              </button>
            </div>
          </div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>
              {dest.name} {formatStay(start, end)}
            </h1>
            <span className={styles.aiBadge}>
              <img src="/images/3d-pio-face.jpg" alt="" className={styles.badgeFace} />
              피오 추천
            </span>
          </div>
          <p className={styles.meta}>
            {formatShort(start)} – {formatShort(end)} · 성인 {draft.adults}명{draft.children ? ` · 아동 ${draft.children}명` : ''}
          </p>
          <p className={styles.stats}>
            <span><b>{stats.stops}</b>곳</span>
            <span>이동 <b>{stats.km.toFixed(1)}</b>km</span>
            <span>1인 예상 <b>{(stats.spend / 10000).toFixed(1)}</b>만원 / 예산 {formatManwon(itinerary.budget[1])}원</span>
          </p>
        </header>
      )}

      <SegmentedTabs
        label="여행 날짜"
        value={String(dayIndex)}
        onChange={(v) => {
          setDayIndex(Number(v));
          setDrawerOpen(false);
        }}
        controls="day-panel"
        items={itinerary.days.map((d, i) => {
          const date = parseISODate(d.date);
          return { value: String(i), label: `DAY ${i + 1}`, sub: `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, '0')} ${weekday(d.date)}` };
        })}
      />

      <div className={styles.dayHead}>
        <h2 className={styles.dayTitle}>{day.title}</h2>
        <span className={styles.weather}>
          <SmartImage src={weatherIcon(day.forecast.rainChance)} alt="" blend className={styles.weatherIcon} />
          <b>{day.forecast.high}°</b> {weatherLabel(day.forecast.rainChance)}
          {day.rainy && <span className={styles.rain}> · 비 {day.forecast.rainChance}%</span>}
        </span>
        {/* 모바일은 날씨를 지도 위 제목 옆에 두고, 여기에는 그날 장소 수·이동 거리를 보여줘요 */}
        <span className={styles.dayStats}>
          {day.stops.length}곳 · {day.legs.reduce((s, l) => s + l.km, 0).toFixed(1)}km
        </span>
      </div>

      <div id="day-panel" role="tabpanel" className={styles.scroll} ref={listRef}>
        <DayTimeline
          day={day}
          placeOf={placeOf}
          selectedId={selectedId}
          editing={editing}
          onSelect={(id) => {
            setSelectedId(id);
            if (compact && !editing) setDrawerOpen(true);
          }}
          onMove={(from, to) => moveStop(dayIndex, from, to)}
          onRemove={(id) => removeStop(dayIndex, id)}
          onAdd={() => setModal({ mode: 'add', index: day.stops.length })}
        />
      </div>

      <div className={`${styles.actions} mobile-sticky-cta`}>
        <Button
          variant="secondary"
          leftIcon={editing ? <Check size={16} /> : <PencilLine size={16} />}
          onClick={() => setEditing((e) => !e)}
          aria-pressed={editing}
        >
          {editing ? '편집 완료' : '일정 편집'}
        </Button>
        <Button variant="primary" fullWidth rightIcon={<ArrowRight size={16} />} onClick={() => navigate('/overview')}>
          여행 한눈에 보기
        </Button>
      </div>
    </div>
  );

  const map = (
    <>
      {/* 모바일: 지도 위에 뜨는 상단 바 (데스크톱의 패널 헤더 대신) */}
      <div className={styles.mobileTop}>
        <button type="button" className={styles.roundBtn} onClick={() => navigate('/conditions')} aria-label="조건 수정으로 돌아가기">
          <ArrowLeft size={18} />
        </button>
        <p className={styles.titlePill}>
          <b>
            {dest.name} {formatStay(start, end)}
          </b>
          <span>
            <SmartImage src={weatherIcon(day.forecast.rainChance)} alt="" blend className={styles.pillIcon} />
            {day.forecast.high}°
          </span>
        </p>
        <button type="button" className={styles.roundBtn} onClick={() => navigate('/generating')} aria-label="같은 조건으로 일정 다시 만들기">
          <RefreshCw size={16} />
        </button>
      </div>
      <ItineraryMap
        day={day}
        placeOf={placeOf}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
        center={[dest.lat, dest.lng]}
        overlay={isMobile ? { left: 0, bottom: 150, right: 0 } : { left: 0, bottom: 250, right: 0 }}
        showLabel={!drawerOpen}
      />
      {selectedStop && selectedPlace && !drawerOpen && (
        <PlaceSummaryCard order={selectedIndex + 1} stop={selectedStop} place={selectedPlace} onOpen={() => setDrawerOpen(true)} />
      )}
      {!drawerOpen && <PioChat destName={dest.name} onAsk={askPio} busy={aiBusy} />}
      {drawerOpen && selectedStop && selectedPlace && (
        <PlaceDrawer
          order={selectedIndex + 1}
          stop={selectedStop}
          place={selectedPlace}
          onClose={() => setDrawerOpen(false)}
          onReplace={() => setModal({ mode: 'replace', stopId: selectedStop.id })}
        />
      )}
      {modal && (
        <AddPlaceModal
          destinationId={itinerary.destinationId}
          mode={modal.mode}
          excludeIds={itinerary.days.flatMap((d) => d.stops.map((s) => s.placeId))}
          anchor={modalAnchor}
          contextLabel={
            modal.mode === 'add'
              ? `DAY ${dayIndex + 1} · ${modalAnchor ? `${modalAnchor.name} 다음에` : '맨 앞에'} 추가돼요`
              : `DAY ${dayIndex + 1} · ${modalAnchor?.name ?? ''} 대신 들를 곳을 골라주세요`
          }
          onClose={() => setModal(null)}
          onConfirm={(placeId) => {
            if (modal.mode === 'add') insertPlace(dayIndex, modal.index, placeId);
            else replacePlace(dayIndex, modal.stopId, placeId);
            setModal(null);
          }}
        />
      )}
    </>
  );

  return <SplitView panel={panel} map={map} panelLabel="여행 일정" />;
}
