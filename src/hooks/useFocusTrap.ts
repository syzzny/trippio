import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 모달 접근성: 열릴 때 안쪽으로 포커스를 옮기고, Tab이 밖으로 나가지 않게 가두고,
 * ESC로 닫고, 닫히면 열기 전에 있던 요소로 포커스를 돌려줘요.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement>,
  active: boolean,
  onClose: () => void,
  { initialFocus, trap = true }: { initialFocus?: RefObject<HTMLElement>; trap?: boolean } = {},
) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const root = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    (initialFocus?.current ?? root.querySelector<HTMLElement>(FOCUSABLE) ?? root).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      // 모달이 아닌 패널(trap=false)은 ESC·포커스 이동만 하고 Tab은 자유롭게 둬요
      if (!trap || e.key !== 'Tab') return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    root.addEventListener('keydown', onKeyDown);
    return () => {
      root.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
    // onClose는 매 렌더 바뀔 수 있어 열림 상태가 바뀔 때만 다시 설정해요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
