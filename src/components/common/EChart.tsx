import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import type { EChartsCoreOption } from 'echarts/core';

// 필요한 차트만 등록해서 번들 크기를 줄여요 (트리 셰이킹)
echarts.use([PieChart, TooltipComponent, SVGRenderer]);

interface EChartProps {
  option: EChartsCoreOption;
  className?: string;
  /** 스크린리더용 차트 요약 — 차트 자체는 보조 기술에서 숨겨요 */
  label: string;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** ECharts 래퍼: 마운트 시 생성, 옵션 변경 시 갱신, 크기 변화 대응, 언마운트 시 정리 */
export function EChart({ option, className, label }: EChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: 'svg' });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption({ animation: !prefersReducedMotion(), ...option }, { notMerge: true });
  }, [option]);

  return (
    <div role="img" aria-label={label} className={className}>
      <div ref={ref} aria-hidden style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
