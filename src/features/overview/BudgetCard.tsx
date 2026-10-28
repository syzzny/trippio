import { useMemo } from 'react';
import { EChart } from '@/components/common/EChart';
import { formatManwonFixed } from '@/lib/format';
import { budgetNote, type BudgetSlice } from './summary';
import styles from './Overview.module.scss';

const cssVar = (name: string) =>
  typeof window === 'undefined' ? '#ccc' : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#ccc';

interface BudgetCardProps {
  slices: BudgetSlice[];
  /** 1인 최대 예산 */
  limit: number;
}

export function BudgetCard({ slices, limit }: BudgetCardProps) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const remaining = Math.max(0, limit - total);

  const option = useMemo(
    () => ({
      tooltip: {
        trigger: 'item',
        backgroundColor: cssVar('--gray-0'),
        borderColor: cssVar('--gray-200'),
        borderWidth: 1,
        padding: [6, 10],
        textStyle: { color: cssVar('--gray-900'), fontSize: 12, fontFamily: 'inherit' },
        extraCssText: 'border-radius:10px;box-shadow:0 8px 24px rgb(0 0 0 / 10%);',
        formatter: (p: { name: string; value: number; percent: number }) =>
          `${p.name} <b>${formatManwonFixed(p.value)}원</b> · ${Math.round(p.percent)}%`,
      },
      series: [
        {
          type: 'pie',
          radius: ['74%', '98%'],
          startAngle: 90,
          padAngle: 1.5,
          itemStyle: { borderRadius: 4 },
          label: { show: false },
          emphasis: { scale: true, scaleSize: 3 },
          data: [
            ...slices.map((s) => ({ name: s.label, value: s.value, itemStyle: { color: cssVar(s.colorVar) } })),
            ...(remaining > 0
              ? [
                  {
                    name: '예산 여유',
                    value: remaining,
                    itemStyle: { color: cssVar('--gray-100') },
                    emphasis: { disabled: true },
                    tooltip: { show: false },
                  },
                ]
              : []),
          ],
        },
      ],
    }),
    [slices, remaining],
  );

  const summary = `일정 기준 1인 예상 경비 ${formatManwonFixed(total)}원, 예산 ${formatManwonFixed(limit)}원. ${slices
    .map((s) => `${s.label} ${formatManwonFixed(s.value)}원`)
    .join(', ')}`;

  return (
    <section className={styles.card} aria-labelledby="budget-title">
      <header className={styles.cardHead}>
        <h2 id="budget-title" className={styles.cardTitle}>
          예상 경비 <span className={styles.cardSub}>1인 · 일정 기준 추정</span>
        </h2>
      </header>
      <div className={styles.budgetBody}>
        <div className={styles.donut}>
          <EChart option={option} label={summary} className={styles.donutChart} />
          <p className={styles.donutCenter} aria-hidden>
            <b>{formatManwonFixed(total)}</b>
            <span>예산 {Math.round(limit / 10_000)}만원</span>
          </p>
        </div>
        <ul className={styles.legend}>
          {slices.map((s) => (
            <li key={s.key}>
              <i style={{ background: `var(${s.colorVar})` }} aria-hidden />
              <span>{s.label}</span>
              <b>{formatManwonFixed(s.value)}</b>
            </li>
          ))}
        </ul>
      </div>
      <p className={styles.note}>{budgetNote(total, limit, slices)}</p>
    </section>
  );
}
