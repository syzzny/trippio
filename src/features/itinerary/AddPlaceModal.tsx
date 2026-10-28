import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Search, X } from 'lucide-react';
import clsx from 'clsx';
import { Button, Chip, SmartImage, TextField } from '@/components/ui';
import { CATEGORY_LABEL, getPlaces } from '@/data/places';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { distanceKm } from '@/lib/geo';
import { legBetween } from '@/lib/planner';
import { formatDuration } from '@/lib/time';
import type { Place, PlaceCategory } from '@/types/itinerary';
import styles from './AddPlaceModal.module.scss';

interface Props {
  destinationId: string;
  mode: 'add' | 'replace';
  /** 이미 그날 일정에 있는 장소 (목록에서 제외) */
  excludeIds: string[];
  /** 거리 기준 장소 (추가: 앞 장소 / 바꾸기: 바꿀 장소) */
  anchor: Place | null;
  contextLabel: string;
  onClose: () => void;
  onConfirm: (placeId: string) => void;
}

const CATEGORIES: (PlaceCategory | 'all')[] = ['all', 'food', 'cafe', 'culture', 'nature', 'shopping', 'activity'];

/** 08 · 장소 추가/바꾸기 모달 */
export function AddPlaceModal({ destinationId, mode, excludeIds, anchor, contextLabel, onClose, onConfirm }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useFocusTrap(ref, true, onClose, { initialFocus: searchRef });

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PlaceCategory | 'all'>(anchor && mode === 'replace' ? anchor.category : 'all');
  const [selected, setSelected] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return getPlaces(destinationId)
      .filter((p) => !excludeIds.includes(p.id) && !p.fullDay)
      .filter((p) => category === 'all' || p.category === category)
      .filter((p) => !q || [p.name, p.area, ...p.tags].some((v) => v.toLowerCase().includes(q)))
      .map((p) => ({ place: p, km: anchor ? distanceKm(anchor, p) : 0 }))
      .sort((a, b) => a.km - b.km);
  }, [destinationId, excludeIds, category, query, anchor]);

  const chosen = results.find((r) => r.place.id === selected);
  const extra = chosen ? chosen.place.duration + (anchor ? legBetween(anchor, chosen.place).minutes : 0) - (mode === 'replace' && anchor ? anchor.duration : 0) : 0;

  return createPortal(
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="add-title" aria-describedby="add-desc">
        <header className={styles.header}>
          <div>
            <h2 id="add-title" className={styles.title}>{mode === 'add' ? '장소 추가' : '다른 장소로 바꾸기'}</h2>
            <p id="add-desc" className={styles.desc}>{contextLabel}</p>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            <X size={16} />
          </button>
        </header>

        <TextField
          ref={searchRef}
          label="장소 검색"
          hideLabel
          type="search"
          placeholder="장소 이름, 지역, 키워드로 검색"
          icon={<Search size={18} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className={styles.filters} role="group" aria-label="카테고리">
          {CATEGORIES.map((c) => (
            <Chip key={c} selected={category === c} showCheck onClick={() => setCategory(c)}>
              {c === 'all' ? '전체' : CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </div>

        <div className={styles.listHead}>
          <span aria-live="polite">검색 결과 {results.length}곳</span>
          <span>{anchor ? '동선 가까운 순' : '인기순'}</span>
        </div>

        <ul className={styles.list} role="radiogroup" aria-label="장소 목록">
          {results.map(({ place, km }, i) => {
            const isSel = selected === place.id;
            const leg = anchor ? legBetween(anchor, place) : null;
            return (
              <li key={place.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSel}
                  className={clsx(styles.item, isSel && styles.selected)}
                  onClick={() => setSelected(place.id)}
                  onDoubleClick={() => onConfirm(place.id)}
                >
                  <SmartImage src={place.image} alt="" className={styles.thumb} />
                  <span className={styles.text}>
                    <span className={styles.nameRow}>
                      <span className={styles.name}>{place.name}</span>
                      {anchor && i === 0 && !query && <span className={styles.badge}>동선 추천</span>}
                    </span>
                    <span className={styles.meta}>
                      {CATEGORY_LABEL[place.category]} · {place.area}
                      {leg && ` · ${leg.mode === 'walk' ? '도보' : '대중교통'} ${leg.minutes}분 (${km.toFixed(1)}km)`}
                    </span>
                  </span>
                  <span className={styles.radio} aria-hidden>
                    {isSel && <Check size={12} strokeWidth={3} />}
                  </span>
                </button>
              </li>
            );
          })}
          {results.length === 0 && <li className={styles.empty}>조건에 맞는 장소가 없어요</li>}
        </ul>

        <footer className={styles.footer}>
          <span className={styles.summary} aria-live="polite">
            {chosen ? `${chosen.place.name} 선택 · 일정이 ${extra >= 0 ? `${formatDuration(extra)} 늘어나요` : `${formatDuration(-extra)} 줄어요`}` : '장소를 하나 골라주세요'}
          </span>
          <Button variant="ghost" onClick={onClose}>취소</Button>
          <Button variant="primary" disabled={!selected} onClick={() => selected && onConfirm(selected)}>
            {mode === 'add' ? '일정에 추가' : '이 장소로 바꾸기'}
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
