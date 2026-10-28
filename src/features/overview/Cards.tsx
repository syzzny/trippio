import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  ChevronRight, CreditCard, Coins, ExternalLink, Footprints, Phone, Plug, Shirt, TrainFront, type LucideIcon,
} from 'lucide-react';
import { Checkbox, SmartImage } from '@/components/ui';
import { weatherIcon } from '@/features/conditions/weatherIcon';
import { rateShortLabel, type ExchangeRate } from '@/api/exchange';
import { diffDays, formatStay, parseISODate, todayISO, weekday } from '@/lib/date';
import { CURRENCY_NAME, CURRENCY_SYMBOL, CURRENCY_UNIT, formatManwonFixed, roundNice } from '@/lib/format';
import type { DayPlan } from '@/types/itinerary';
import type { MustEat, TipIcon, TravelGuide } from '@/data/travelGuide';
import { withRo } from '@/lib/korean';
import { isRainyDay, outfitTip, type DaySummary } from './summary';
import styles from './Overview.module.scss';

const monthDay = (iso: string) => {
  const d = parseISODate(iso);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`;
};

/* ───────── D-day ───────── */

export function DdayCard({ destName, start, end, done, total }: {
  destName: string; start: string; end: string; done: number; total: number;
}) {
  const today = todayISO();
  const left = diffDays(today, start);
  const [lead, big] =
    left > 0 ? [`${destName} 여행까지`, `D-${left}`]
      : left === 0 ? [`오늘 ${withRo(destName)} 떠나요`, 'D-DAY']
        : diffDays(today, end) >= 0 ? [`${destName} 여행 중`, `DAY ${1 - left}`]
          : [`${destName} 여행을 다녀왔어요`, '완료'];
  const d = parseISODate(start);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <section className={clsx(styles.card, styles.dday)} aria-labelledby="dday-title">
      <p id="dday-title" className={styles.ddayLead}>{lead}</p>
      <p className={styles.ddayBig}>{big}</p>
      <p className={styles.ddayMeta}>
        {d.getMonth() + 1}월 {d.getDate()}일({weekday(start)}) 출발 · {formatStay(start, end)}
      </p>
      <div className={styles.prep}>
        <div className={styles.prepLabel}>
          <span id="prep-label">여행 준비</span>
          <b>{done} / {total} 완료</b>
        </div>
        <div
          className={styles.track}
          role="progressbar"
          aria-labelledby="prep-label"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={`${total}개 중 ${done}개 완료`}
        >
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
      <SmartImage src="/images/3d-trip-hero.png" alt="" className={styles.ddayHero} loading="eager" />
    </section>
  );
}

/* ───────── 날씨 & 옷차림 ───────── */

export function WeatherCard({ destName, days }: { destName: string; days: DayPlan[] }) {
  return (
    <section className={styles.card} aria-labelledby="weather-title">
      <header className={styles.cardHead}>
        <h2 id="weather-title" className={styles.cardTitle}>
          날씨 &amp; 옷차림 <span className={styles.cardSub}>{destName}</span>
        </h2>
      </header>
      <ul className={styles.weatherDays}>
        {days.map((d) => {
          const rainy = isRainyDay(d);
          return (
            <li key={d.date} className={clsx(rainy && styles.rainyDay)}>
              <span className={styles.wDate}>{weekday(d.date)} {monthDay(d.date)}</span>
              <SmartImage src={weatherIcon(d.forecast.rainChance)} alt="" blend className={styles.wIcon} />
              <span className={styles.wTemp}>
                <b>{d.forecast.high}°</b> <span className="sr-only">최저</span>
                {d.forecast.low}°
              </span>
              <span className={styles.wRain}>비 {d.forecast.rainChance}%</span>
            </li>
          );
        })}
      </ul>
      <p className={styles.tipBox}>
        <Shirt size={16} aria-hidden />
        {outfitTip(days)}
      </p>
    </section>
  );
}

/* ───────── 환전 가이드 ───────── */

export function ExchangeCard({ currency, totalKrw, lodgingKrw, guide, rate, loading }: {
  currency: string; totalKrw: number; lodgingKrw: number; guide: TravelGuide; rate?: ExchangeRate; loading: boolean;
}) {
  if (currency === 'KRW') {
    return (
      <section className={styles.card} aria-labelledby="fx-title">
        <header className={styles.cardHead}>
          <h2 id="fx-title" className={styles.cardTitle}>경비 가이드</h2>
        </header>
        <div className={styles.fxAmount}>
          <span>1인 예상 경비</span>
          <b>{formatManwonFixed(totalKrw)}원</b>
        </div>
        <p className={styles.fxBox}>
          <b>국내 여행이라 환전이 필요 없어요</b>
          <span>카드·간편결제로 대부분 해결돼요</span>
        </p>
      </section>
    );
  }

  const symbol = CURRENCY_SYMBOL[currency] ?? '';
  const unit = CURRENCY_UNIT[currency] ?? 1;
  const local = rate ? roundNice(totalKrw / rate.krwPerUnit) : null;
  const cash = rate ? roundNice(((totalKrw - lodgingKrw) * guide.cashRatio) / rate.krwPerUnit, 2) : null;
  const fmt = (n: number) => `${symbol}${n.toLocaleString('ko-KR')}`;

  return (
    <section className={styles.card} aria-labelledby="fx-title" aria-busy={loading}>
      <header className={styles.cardHead}>
        <h2 id="fx-title" className={styles.cardTitle}>환전 가이드</h2>
      </header>
      <div className={styles.fxTop}>
        <div className={styles.fxAmount}>
          <span>1인 예상 경비</span>
          <b>{local !== null ? fmt(local) : '—'}</b>
          <small>≈ {formatManwonFixed(totalKrw)}원</small>
        </div>
        <SmartImage src="/images/3d-coins.jpg" alt="" blend className={styles.fxIcon} />
      </div>
      <p className={styles.fxRate}>
        <i aria-hidden />
        {rate
          ? `${unit}${CURRENCY_NAME[currency] ?? currency} = ${Math.round(rate.krwPerUnit * unit).toLocaleString('ko-KR')}원 · ${rateShortLabel(rate)}`
          : '환율을 불러오고 있어요'}
      </p>
      {cash !== null && cash > 0 && (
        <p className={styles.fxBox}>
          <b>현금 {fmt(cash)} + 나머지는 카드</b>
          <span>{guide.cashNote}</span>
        </p>
      )}
    </section>
  );
}

/* ───────── 하루 일정 하이라이트 ───────── */

export function HighlightsCard({ days, maxSpend }: { days: DaySummary[]; maxSpend: number }) {
  return (
    <section className={styles.card} aria-labelledby="hl-title">
      <header className={styles.cardHead}>
        <h2 id="hl-title" className={styles.cardTitle}>하루 일정 하이라이트</h2>
        <Link to="/plan" className={styles.more}>
          일정 보기 <ChevronRight size={14} aria-hidden />
        </Link>
      </header>
      <ol className={styles.hlList}>
        {days.map((d) => (
          <li key={d.date}>
            <Link to="/plan" state={{ day: d.index }} className={styles.hlRow}>
              <span className={styles.dayBadge}>DAY {d.index + 1} · {weekday(d.date)}</span>
              <SmartImage src={d.image} alt="" blend className={styles.hlIcon} />
              <span className={styles.hlText}>
                <b>{d.title}</b>
                <span>
                  {d.route.join(' → ')}
                  {d.moreCount > 0 && ` 외 ${d.moreCount}곳`}
                </span>
              </span>
              <span className={styles.hlWalk}>
                <Footprints size={14} aria-hidden /> {d.walkKm >= 0.1 ? `도보 ${d.walkKm.toFixed(1)}km` : '걷기 거의 없음'}
              </span>
              <span className={styles.hlSpend}>
                <span className={styles.hlSpendLabel}>
                  <b>{formatManwonFixed(d.spend)}원</b>
                  {d.over > 0 && <em>예산 +{formatManwonFixed(d.over)}</em>}
                </span>
                <span className={clsx(styles.bar, d.over > 0 && styles.barOver)} aria-hidden>
                  <span style={{ width: `${Math.max(4, (d.spend / maxSpend) * 100)}%` }} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ───────── 준비물 체크 ───────── */

export function ChecklistCard({ items, isChecked, toggle, done }: {
  items: string[]; isChecked: (i: string) => boolean; toggle: (i: string) => void; done: number;
}) {
  return (
    <section className={styles.card} aria-labelledby="check-title">
      <header className={styles.cardHead}>
        <h2 id="check-title" className={styles.cardTitle}>준비물 체크</h2>
        <span className={styles.count} aria-live="polite">
          {done} / {items.length}
        </span>
      </header>
      <ul className={styles.checkGrid}>
        {items.map((item) => (
          <li key={item}>
            <Checkbox label={item} checked={isChecked(item)} onChange={() => toggle(item)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────── 꼭 먹어볼 것 ───────── */

export function FoodCard({ destName, foods, currency }: { destName: string; foods: MustEat[]; currency: string }) {
  const symbol = currency === 'KRW' ? '' : CURRENCY_SYMBOL[currency] ?? '';
  const price = (n: number) => (currency === 'KRW' ? `약 ${n.toLocaleString('ko-KR')}원` : `약 ${symbol}${n.toLocaleString('ko-KR')}`);
  return (
    <section className={styles.card} aria-labelledby="food-title">
      <header className={styles.cardHead}>
        <h2 id="food-title" className={styles.cardTitle}>{destName}에서 꼭 먹어볼 것</h2>
        <a
          className={styles.more}
          href={`https://www.google.com/maps/search/${encodeURIComponent(`${destName} 맛집`)}`}
          target="_blank"
          rel="noreferrer"
        >
          맛집 더보기 <ExternalLink size={13} aria-hidden />
          <span className="sr-only">(새 창)</span>
        </a>
      </header>
      <ul className={styles.foods}>
        {foods.map((f) => (
          <li key={f.name}>
            <SmartImage src={f.image} alt="" blend className={styles.foodImg} />
            <b>{f.name}</b>
            <span>{f.desc}</span>
            <small>{price(f.price)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────── 알아두면 좋아요 ───────── */

const TIP_ICON: Record<TipIcon, LucideIcon> = {
  plug: Plug, card: CreditCard, coins: Coins, phone: Phone, train: TrainFront, shirt: Shirt,
};

export function TipsCard({ tips }: { tips: TravelGuide['tips'] }) {
  return (
    <section className={styles.card} aria-labelledby="tips-title">
      <header className={styles.cardHead}>
        <h2 id="tips-title" className={styles.cardTitle}>알아두면 좋아요</h2>
      </header>
      <ul className={styles.tips}>
        {tips.map((t) => {
          const Icon = TIP_ICON[t.icon];
          return (
            <li key={t.text}>
              <span className={styles.tipIcon} aria-hidden>
                <Icon size={14} />
              </span>
              {t.text}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
