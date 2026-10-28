import clsx from 'clsx';
import { Check, X } from 'lucide-react';
import { GENERATION_STEPS } from '@/api/itinerary';
import type { GenerationStep } from '@/types/itinerary';
import styles from './StepList.module.scss';

export type StepState = 'todo' | 'running' | 'done' | 'failed';

interface Props {
  states: Record<GenerationStep, StepState>;
  notes: Partial<Record<GenerationStep, string>>;
}

export function StepList({ states, notes }: Props) {
  return (
    <ol className={styles.list}>
      {GENERATION_STEPS.map((s) => {
        const st = states[s.id];
        return (
          <li key={s.id} className={clsx(styles.step, styles[st])} aria-current={st === 'running' ? 'step' : undefined}>
            <span className={styles.status} aria-hidden>
              {st === 'done' && <Check size={13} strokeWidth={3} />}
              {st === 'failed' && <X size={12} strokeWidth={3} />}
              {st === 'running' && <span className={styles.pulse} />}
            </span>
            <span className={styles.text}>
              <span className={styles.title}>{s.title}</span>
              {notes[s.id] && <span className={styles.note}>{notes[s.id]}</span>}
            </span>
            {st === 'running' && <span className={styles.badge}>진행 중</span>}
            <span className="sr-only">
              {{ todo: '대기', running: '진행 중', done: '완료', failed: '실패' }[st]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
