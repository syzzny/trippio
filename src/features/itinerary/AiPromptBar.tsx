import { useState, type FormEvent } from 'react';
import { ArrowUp, LoaderCircle } from 'lucide-react';
import { SmartImage } from '@/components/ui';
import styles from './AiPromptBar.module.scss';

const SUGGESTIONS = ['더 여유롭게', '맛집 하나 더 넣어줘', '둘째 날은 쇼핑 위주로'];

/** 생성된 일정을 대화하듯 다시 고치는 입력창 */
interface Props {
  /** 성공하면 true — 입력창을 비워요 */
  onSubmit: (text: string) => Promise<boolean> | boolean;
  /** AI가 일정을 고치는 중 */
  busy?: boolean;
}

export function AiPromptBar({ onSubmit, busy = false }: Props) {
  const [text, setText] = useState('');
  const send = async (value: string) => {
    if (!value.trim() || busy) return;
    if (await onSubmit(value.trim())) setText('');
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void send(text);
  };
  return (
    <div className={styles.wrap}>
      <ul className={styles.suggestions} aria-label="추천 수정 요청">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button type="button" className={styles.suggestion} onClick={() => void send(s)} disabled={busy}>
              {s}
            </button>
          </li>
        ))}
      </ul>
      <form className={styles.bar} onSubmit={submit} role="search" aria-label="AI에게 일정 수정 요청" aria-busy={busy}>
        <SmartImage src="/images/3d-sparkle.png" alt="" className={styles.icon} loading="eager" />
        <label htmlFor="ai-edit" className="sr-only">AI에게 수정 요청</label>
        <input
          id="ai-edit"
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={busy ? 'AI가 일정을 고치고 있어요…' : 'AI에게 수정 요청 · 예) 둘째 날 오후에 쇼핑 넣어줘'}
          autoComplete="off"
          readOnly={busy}
        />
        <button type="submit" className={styles.send} disabled={!text.trim() || busy} aria-label={busy ? '수정 중' : '요청 보내기'}>
          {busy ? <LoaderCircle size={16} className={styles.spin} /> : <ArrowUp size={16} strokeWidth={2.4} />}
        </button>
      </form>
    </div>
  );
}
