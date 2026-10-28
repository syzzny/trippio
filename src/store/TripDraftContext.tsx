import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { TravelStyle, TripDraft } from '@/types/trip';
import { addDays, todayISO } from '@/lib/date';

type Action =
  | { type: 'selectDestination'; id: string }
  | { type: 'setDates'; startDate: string; endDate: string }
  | { type: 'setPeople'; key: 'adults' | 'children'; value: number }
  | { type: 'setBudget'; budget: [number, number] }
  | { type: 'toggleStyle'; style: TravelStyle }
  | { type: 'setRequest'; request: string }
  | { type: 'load'; draft: Partial<TripDraft> }
  | { type: 'reset' };

const STORAGE_KEY = 'trippio:draft';

const createInitialDraft = (): TripDraft => {
  const start = addDays(todayISO(), 18);
  return {
    destinationId: 'osaka',
    startDate: start,
    endDate: addDays(start, 3),
    adults: 2,
    children: 0,
    budget: [300_000, 600_000],
    styles: ['food', 'nature', 'cafe'],
    request: '',
  };
};

const reducer = (state: TripDraft, action: Action): TripDraft => {
  switch (action.type) {
    case 'selectDestination':
      return { ...state, destinationId: action.id };
    case 'setDates':
      return { ...state, startDate: action.startDate, endDate: action.endDate };
    case 'setPeople':
      return { ...state, [action.key]: action.value };
    case 'setBudget':
      return { ...state, budget: action.budget };
    case 'toggleStyle':
      return {
        ...state,
        styles: state.styles.includes(action.style)
          ? state.styles.filter((s) => s !== action.style)
          : [...state.styles, action.style],
      };
    case 'setRequest':
      return { ...state, request: action.request };
    case 'load':
      return { ...state, ...action.draft };
    case 'reset':
      return createInitialDraft();
  }
};

const load = (): TripDraft => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return { ...createInitialDraft(), ...JSON.parse(raw) };
  } catch {
    /* 저장소를 쓸 수 없는 환경이면 기본값으로 시작 */
  }
  return createInitialDraft();
};

const TripDraftContext = createContext<{ draft: TripDraft; dispatch: React.Dispatch<Action> } | null>(null);

export function TripDraftProvider({ children }: { children: ReactNode }) {
  const [draft, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* noop */
    }
  }, [draft]);

  const value = useMemo(() => ({ draft, dispatch }), [draft]);
  return <TripDraftContext.Provider value={value}>{children}</TripDraftContext.Provider>;
}

export const useTripDraft = () => {
  const ctx = useContext(TripDraftContext);
  if (!ctx) throw new Error('useTripDraft must be used within TripDraftProvider');
  return ctx;
};
