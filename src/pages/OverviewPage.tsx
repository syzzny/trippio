import { useMemo, useState } from 'react';
import { Share } from 'lucide-react';
import { Button } from '@/components/ui';
import { EmptyTrip } from '@/components/common/EmptyTrip';
import { usePlaceLookup } from '@/features/itinerary/usePlaceLookup';
import { BudgetCard } from '@/features/overview/BudgetCard';
import {
  ChecklistCard, DdayCard, ExchangeCard, FoodCard, HighlightsCard, TipsCard, WeatherCard,
} from '@/features/overview/Cards';
import { summarizeBudget, summarizeDays } from '@/features/overview/summary';
import { buildChecklist, checklistKey } from '@/features/overview/checklist';
import { useChecklist } from '@/features/overview/useChecklist';
import { useExchangeRate } from '@/api/exchange';
import { getDestination } from '@/data/destinations';
import { getTravelGuide, type MustEat } from '@/data/travelGuide';
import { useItinerary } from '@/store/ItineraryContext';
import { useTripDraft } from '@/store/TripDraftContext';
import { formatShort, formatStay } from '@/lib/date';
import { formatManwonFixed, roundNice } from '@/lib/format';
import styles from './OverviewPage.module.scss';

export default function OverviewPage() {
  const { itinerary } = useItinerary();
  const { draft } = useTripDraft();
  const dest = getDestination(itinerary?.destinationId ?? null);
  const placeOf = usePlaceLookup(itinerary?.destinationId);
  const { data: rate, isPending: ratePending } = useExchangeRate(dest?.currency);
  const [shareMsg, setShareMsg] = useState('');

  const guide = getTravelGuide(dest?.id ?? '', dest?.region === 'domestic');

  const derived = useMemo(() => {
    if (!itinerary) return null;
    const days = summarizeDays(itinerary, placeOf);
    const slices = summarizeBudget(itinerary, placeOf);
    const total = slices.reduce((s, x) => s + x.value, 0);
    const checklist = buildChecklist(itinerary);
    return { days, slices, total, checklist, maxSpend: Math.max(...days.map((d) => d.spend), 1) };
  }, [itinerary, placeOf, guide]);

  const check = useChecklist(itinerary ? checklistKey(itinerary) : 'trippio:checklist:none', derived?.checklist ?? []);

  // 정해 둔 먹거리가 없는 여행지는 일정에 있는 맛집으로 채워요
  const foods: MustEat[] = useMemo(() => {
    if (guide.mustEat.length || !itinerary) return guide.mustEat;
    const krw = dest?.currency === 'KRW' ? 1 : rate?.krwPerUnit ?? 0;
    const seen = new Set<string>();
    return itinerary.days
      .flatMap((d) => d.stops.map((s) => placeOf(s.placeId)))
      .filter((p) => p && p.category === 'food' && !seen.has(p.id) && seen.add(p.id))
      .slice(0, 3)
      .map((p) => ({ name: p!.name, desc: p!.area, price: krw ? roundNice(p!.cost / krw, 2) : 0, image: p!.image }));
  }, [guide, itinerary, placeOf, rate, dest]);

  if (!itinerary || !dest || !derived) return <EmptyTrip />;

  const start = itinerary.days[0].date;
  const end = itinerary.days[itinerary.days.length - 1].date;
  const people = `성인 ${draft.adults}명${draft.children ? ` · 아동 ${draft.children}명` : ''}`;

  const share = async () => {
    const text = [
      `[Trippio] ${dest.name} ${formatStay(start, end)} (${formatShort(start)} – ${formatShort(end)})`,
      ...derived.days.map((d) => `DAY ${d.index + 1} ${d.title} — ${d.route.join(' → ')}`),
      `1인 예상 경비 ${formatManwonFixed(derived.total)}원`,
    ].join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: `${dest.name} 여행 일정`, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareMsg('일정 요약을 복사했어요. 메신저에 붙여넣어 보내 보세요');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setShareMsg('공유하지 못했어요. 잠시 후 다시 시도해 주세요');
    }
    window.setTimeout(() => setShareMsg(''), 3000);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>내 여행 한눈에</h1>
          <p className={styles.meta}>
            {dest.name} {formatStay(start, end)} · {formatShort(start)} – {formatShort(end)} · {people}
          </p>
        </div>
        <Button variant="secondary" size="sm" leftIcon={<Share size={16} />} onClick={share}>
          일행에게 공유
        </Button>
      </header>

      <div className={styles.row1}>
        <DdayCard destName={dest.name} start={start} end={end} done={check.done} total={check.total} />
        <WeatherCard destName={dest.name} days={itinerary.days} />
        <ExchangeCard
          currency={dest.currency}
          totalKrw={derived.total}
          lodgingKrw={itinerary.lodgingPerPerson}
          guide={guide}
          rate={rate}
          loading={ratePending}
        />
      </div>

      <div className={styles.row2}>
        <HighlightsCard days={derived.days} maxSpend={derived.maxSpend} />
        <BudgetCard slices={derived.slices} limit={itinerary.budget[1]} />
      </div>

      <div className={styles.row3}>
        <ChecklistCard items={derived.checklist} isChecked={check.isChecked} toggle={check.toggle} done={check.done} />
        {foods.length > 0 && <FoodCard destName={dest.name} foods={foods} currency={dest.currency} />}
        <TipsCard tips={guide.tips} />
      </div>

      <p className={styles.toast} role="status" aria-live="polite">
        {shareMsg}
      </p>
    </div>
  );
}
