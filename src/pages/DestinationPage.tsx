import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { Button, Chip, SegmentedTabs, SmartImage, TextField } from '@/components/ui';
import { SplitView } from '@/components/common/SplitView';
import { PanelHeader } from '@/components/common/PanelHeader';
import { DestinationCard } from '@/features/destination/DestinationCard';
import { DestinationMap } from '@/features/destination/DestinationMap';
import { DestinationPreview } from '@/features/destination/DestinationPreview';
import { useDestinationFilter } from '@/features/destination/useDestinationFilter';
import { DESTINATIONS, THEME_FILTERS, getDestination } from '@/data/destinations';
import { useTripDraft } from '@/store/TripDraftContext';
import { withRo } from '@/lib/korean';
import type { DestinationTheme, Region } from '@/types/trip';
import styles from './DestinationPage.module.scss';

const COUNT = {
  overseas: DESTINATIONS.filter((d) => d.region === 'overseas').length,
  domestic: DESTINATIONS.filter((d) => d.region === 'domestic').length,
};

export default function DestinationPage() {
  const navigate = useNavigate();
  const { draft, dispatch } = useTripDraft();
  const current = getDestination(draft.destinationId);

  const [region, setRegion] = useState<Region>(current?.region ?? 'overseas');
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState<DestinationTheme | 'all'>('all');
  const list = useDestinationFilter(region, query, theme);

  // 탭을 바꿨을 때 선택된 여행지가 목록에 없으면 미리보기는 숨김
  const selected = current && current.region === region ? current : null;
  const select = (id: string) => dispatch({ type: 'selectDestination', id });

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key) || list.length === 0) return;
    e.preventDefault();
    const idx = list.findIndex((d) => d.id === selected?.id);
    const next = list[(idx + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length];
    select(next.id);
    (e.currentTarget.querySelectorAll('[role="radio"]')[list.indexOf(next)] as HTMLElement | undefined)?.focus();
  };

  const panel = (
    <div className={styles.panel}>
      <PanelHeader
        step={1}
        total={3}
        stepLabel="DESTINATION"
        title="어디로 떠나볼까요?"
        description="여행지와 조건만 고르면, 여행 친구 피오가 날씨·동선·예산에 맞춰 일정을 세워드려요."
        aside={<SmartImage src="/images/3d-globe.jpg" alt="" blend className={styles.globe} />}
      />

      <SegmentedTabs
        label="여행 지역"
        value={region}
        onChange={(v) => {
          setRegion(v);
          setTheme('all');
        }}
        controls="destination-list"
        items={[
          { value: 'overseas', label: '해외', badge: COUNT.overseas },
          { value: 'domestic', label: '국내', badge: COUNT.domestic },
        ]}
      />

      <TextField
        label="여행지 검색"
        hideLabel
        type="search"
        placeholder="도시, 국가 이름으로 검색"
        icon={<Search size={18} />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className={styles.listHeader}>
        <h2 className={styles.listTitle}>{query ? `‘${query}’ 검색 결과` : `11월 인기 ${region === 'overseas' ? '해외' : '국내'} 여행지`}</h2>
        <span className={styles.count}>{list.length}곳</span>
      </div>

      <div className={styles.scroll}>
        {list.length > 0 ? (
          <ul
            id="destination-list"
            role="radiogroup"
            aria-label="여행지 목록"
            className={styles.list}
            onKeyDown={onListKeyDown}
          >
            {list.map((d, i) => (
              <DestinationCard
                key={d.id}
                destination={d}
                selected={d.id === selected?.id}
                onSelect={() => select(d.id)}
                tabIndex={d.id === selected?.id || (!selected && i === 0) ? 0 : -1}
              />
            ))}
          </ul>
        ) : (
          <div className={styles.empty} role="status">
            <SmartImage src="/images/3d-empty-suitcase.jpg" alt="" blend className={styles.emptyImg} />
            <p className={styles.emptyTitle}>찾는 여행지가 없어요</p>
            <p className={styles.emptyDesc}>다른 이름으로 검색하거나 지역 탭을 바꿔보세요</p>
          </div>
        )}
      </div>

      <div className="mobile-sticky-cta">
        <Button
          variant="primary"
          fullWidth
          disabled={!selected}
          rightIcon={<ArrowRight size={16} />}
          onClick={() => navigate('/conditions')}
        >
          {selected ? `${withRo(selected.name)} 여행 조건 설정하기` : '여행지를 선택해 주세요'}
        </Button>
      </div>
    </div>
  );

  const map = (
    <>
      <DestinationMap destinations={list} selected={selected} onSelect={select} />
      <div className={styles.filters} role="group" aria-label="테마 필터">
        {THEME_FILTERS.map((f) => (
          <Chip
            key={f.id}
            shape="pill"
            selected={theme === f.id}
            dotColor={'color' in f ? f.color : undefined}
            onClick={() => setTheme(f.id)}
          >
            {f.label}
          </Chip>
        ))}
      </div>
      {selected && <DestinationPreview destination={selected} />}
    </>
  );

  return <SplitView panel={panel} map={map} panelLabel="여행지 선택" />;
}
