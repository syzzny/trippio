/** Trippio 로고 — 민트 둥근 사각형 안의 피오 얼굴 (파비콘과 같은 그림) */
export function Logo({ size = 44 }: { size?: number }) {
  return (
    <img
      src="/images/3d-pio-touch.png"
      width={size}
      height={size}
      alt="Trippio"
      style={{ display: 'block', borderRadius: size * 0.28 }}
    />
  );
}
