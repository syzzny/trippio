import { useEffect, useRef, useState, type FormEvent } from 'react';
import clsx from 'clsx';
import { ArrowUp, Undo2 } from 'lucide-react';
import styles from './PioChat.module.scss';

/** 피오에게 보낸 요청의 결과 */
export interface PioReply {
  /** 피오가 하는 말 */
  message: string;
  /** 일정을 바꿨다면 되돌리는 함수 */
  undo?: () => void;
}

interface Message {
  id: number;
  from: 'pio' | 'me';
  text: string;
  undo?: () => void;
  undone?: boolean;
}

interface Props {
  destName: string;
  /** 요청을 처리하고 피오의 답을 돌려줘요. null이면 다른 화면으로 넘어간 경우 */
  onAsk: (text: string) => Promise<PioReply | null>;
  busy: boolean;
}

const QUICK_REPLIES = ['더 여유롭게 해줘', '맛집 하나 더 넣어줘', '둘째 날은 쇼핑 위주로'];
const MAX_VISIBLE = 4;

let seq = 0;

/** 여행 친구 '피오'와 대화하듯 일정을 고치는 창 (지도 아래쪽에 떠 있어요) */
export function PioChat({ destName, onAsk, busy }: Props) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: seq++, from: 'pio', text: `${destName} 일정, 마음에 드세요? 바꾸고 싶은 게 있으면 편하게 말해 주세요!` },
  ]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (value: string) => {
    const request = value.trim();
    if (!request || busy) return;
    setText('');
    setMessages((m) => [...m, { id: seq++, from: 'me', text: request }]);
    const reply = await onAsk(request);
    if (!reply) return;
    setMessages((m) => [...m, { id: seq++, from: 'pio', text: reply.message, undo: reply.undo }]);
  };

  const undo = (id: number) => {
    setMessages((list) => {
      const target = list.find((m) => m.id === id);
      target?.undo?.();
      return [
        ...list.map((m) => (m.id === id ? { ...m, undone: true } : m)),
        { id: seq++, from: 'pio' as const, text: '알겠어요, 방금 바꾼 걸 원래대로 돌려놨어요.' },
      ];
    });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void send(text);
  };

  const visible = messages.slice(-MAX_VISIBLE);
  const userTalked = messages.some((m) => m.from === 'me');

  return (
    <section className={clsx(styles.wrap, userTalked && styles.talking)} aria-label="피오와 대화하며 일정 고치기">
      {/* 카드 위로 살짝 걸터앉은 피오 — 대화 상대가 누구인지 한눈에 보이게 */}
      <img src="/images/3d-pio-cut.png" alt="" className={clsx(styles.pio, busy && styles.pioBusy)} />
      <div className={styles.head}>
        <b>피오</b>
        <span>{busy ? '일정을 고치는 중…' : '여행 친구 · 일정 수정 도우미'}</span>
      </div>
      <div ref={logRef} className={styles.log} role="log" aria-live="polite" aria-label="피오와 나눈 대화">
        {visible.map((m) =>
          m.from === 'pio' ? (
            <div key={m.id} className={styles.pioRow}>
              <div className={styles.pioBubble}>
                <span className="sr-only">피오: </span>
                {m.text}
                {m.undo && (
                  <button type="button" className={styles.undo} onClick={() => undo(m.id)} disabled={m.undone || busy}>
                    <Undo2 size={13} aria-hidden /> {m.undone ? '되돌렸어요' : '되돌리기'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div key={m.id} className={styles.meRow}>
              <p className={styles.meBubble}>
                <span className="sr-only">나: </span>
                {m.text}
              </p>
            </div>
          ),
        )}
        {busy && (
          <div className={styles.pioRow}>
            <div className={clsx(styles.pioBubble, styles.typing)}>
              <span>일정을 고치는 중이에요</span>
              <span className={styles.dots} aria-hidden>
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        )}
      </div>

      {!busy && (
        <ul className={styles.quick} aria-label="빠른 요청">
          {QUICK_REPLIES.map((q) => (
            <li key={q}>
              <button type="button" className={styles.chip} onClick={() => void send(q)}>
                {q}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className={styles.bar} onSubmit={submit} aria-busy={busy}>
        <img src="/images/3d-pio-face.jpg" alt="" className={styles.barFace} />
        <label htmlFor="pio-input" className="sr-only">
          피오에게 말하기
        </label>
        <input
          id="pio-input"
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={busy ? '피오가 일정을 고치고 있어요…' : '피오에게 말하기 · 예) 둘째 날 오후에 쇼핑 넣어줘'}
          autoComplete="off"
          readOnly={busy}
        />
        <button type="submit" className={styles.send} disabled={!text.trim() || busy} aria-label="보내기">
          <ArrowUp size={16} strokeWidth={2.4} />
        </button>
      </form>
    </section>
  );
}
