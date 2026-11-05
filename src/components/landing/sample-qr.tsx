// Looks like a QR code without being one, so nobody scans the sample: the corner squares are
// right, but the rest is a fixed pattern that doesn't decode
const SIZE = 21;

const ring = (x: number, y: number) =>
  x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);

function isFilled(x: number, y: number, seed: number): boolean {
  if (x < 7 && y < 7) return ring(x, y);
  if (x > 13 && y < 7) return ring(x - 14, y);
  if (x < 7 && y > 13) return ring(x, y - 14);
  if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) return false;
  return (x * 7 + y * 13 + x * y * seed) % 5 < 2;
}

function pattern(seed: number): string {
  let path = "";
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (isFilled(x, y, seed)) path += `M${x} ${y}h1v1h-1z`;
    }
  }
  return path;
}

/**
 * Decorative, so it's hidden from screen readers
 */
export function SampleQr({ seed, size }: { seed: number; size: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className="shrink-0"
    >
      <path d={pattern(seed)} fill="#16141D" />
    </svg>
  );
}
