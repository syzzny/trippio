import clsx from 'clsx';
import { SmartImage } from '@/components/ui';
import { useForecast } from '@/api/weather';
import { formatShort, formatStay, weekday } from '@/lib/date';
import { formatManwon } from '@/lib/format';
import { STYLE_LABEL } from '@/data/styles';
import type { Destination, TripDraft } from '@/types/trip';
import { weatherIcon, weatherLabel } from './weatherIcon';
import styles from './TripSummary.module.scss';

export function TripSummary({ destination: d, draft }: { destination: Destination; draft: TripDraft }) {
  const { data: forecast = [], isFetching } = useForecast(d, draft.startDate, draft.endDate);
  const source = forecast[0]?.source;

  const rows: [string, string][] = [
    ['여행지', `${d.name}, ${d.countryKo}`],
    ['날짜', `${formatShort(draft.startDate)} – ${formatShort(draft.endDate)}`],
    ['인원', `성인 ${draft.adults}명${draft.children ? ` · 아동 ${draft.children}명` : ''}`],
    ['예산', `1인 ${formatManwon(draft.budget[0])} – ${formatManwon(draft.budget[1])}원`],
    ['스타일', draft.styles.length ? draft.styles.map((s) => STYLE_LABEL[s]).join(' · ') : '선택 안 함'],
  ];
  if (draft.request.trim()) rows.push(['요청사항', draft.request.trim()]);

  return (
    <aside className={styles.card} aria-label="내 여행 요약">
      <div className={styles.head}>
        <h2 className={styles.title}>내 여행 요약</h2>
        <span className={styles.live}>
          <span className={styles.liveDot} aria-hidden />
          실시간 반영
        </span>
      </div>

      <dl className={styles.rows}>
        {rows.map(([k, v]) => (
          <div key={k} className={styles.row}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="forecast-title" aria-busy={isFetching}>
        <div className={styles.forecastHead}>
          <h3 id="forecast-title" className={styles.subTitle}>
            예상 날씨 <span className={styles.stay}>· {formatStay(draft.startDate, draft.endDate)}</span>
          </h3>
          <span className={styles.source}>{source === 'forecast' ? '기상 예보' : '평년 기준'}</span>
        </div>
        <ul className={styles.days}>
          {forecast.slice(0, 7).map((f) => (
            <li key={f.date} className={clsx(styles.day, f.rainChance >= 40 && styles.rainy)}>
              <span className={styles.dayLabel}>{weekday(f.date)}</span>
              <SmartImage src={weatherIcon(f.rainChance)} alt={weatherLabel(f.rainChance)} blend className={styles.icon} />
              <span className={styles.temp}>
                {f.high}°<span>{f.low}°</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
