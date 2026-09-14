"use client";

/**
 * Placeholder QR rendering for evidence and property labels.
 *
 * Deterministic block pattern standing in for a real encoder, so labels lay out
 * correctly and print at the right size. Swap the body for a real QR encoder
 * before labels are used operationally — a scanner will not read this.
 */
export function QrPlaceholder({ size = 148 }: { size?: number }) {
  const cells = 21;
  const cell = size / cells;
  const filled = (r: number, c: number) => (r * 7 + c * 13 + ((r * c) % 5)) % 3 === 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="QR code">
      <rect width={size} height={size} fill="white" />
      {Array.from({ length: cells }).map((_, r) =>
        Array.from({ length: cells }).map((_, c) => {
          const corner =
            (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
          const on = corner
            ? r % 6 === 0 || c % 6 === 0 || (r > 1 && r < 5 && c > 1 && c < 5)
            : filled(r, c);
          return on ? (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill="#101828"
            />
          ) : null;
        }),
      )}
    </svg>
  );
}
