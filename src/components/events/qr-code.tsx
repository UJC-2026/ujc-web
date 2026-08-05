import { create } from "qrcode";

/**
 * Renders the QR module bitmap straight to SVG elements.
 *
 * The library can emit an SVG string, but that would have to go in through
 * `dangerouslySetInnerHTML`; building the rects here keeps the markup ours and
 * lets the colours come from the design tokens like everything else. `create()`
 * is pure computation, so this stays a server component.
 */
export function QrCode({
  value,
  className,
  title,
}: {
  value: string;
  className?: string;
  title: string;
}) {
  // 'M' tolerates a phone camera on a printed sheet under bad lighting without
  // inflating the module count the way 'H' does.
  const { modules } = create(value, { errorCorrectionLevel: "M" });
  const size = modules.size;
  const quiet = 4; // Quiet zone the QR spec requires for reliable scanning.
  const total = size + quiet * 2;

  const rects: string[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (modules.data[y * size + x]) rects.push(`${x + quiet},${y + quiet}`);
    }
  }

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      role="img"
      aria-label={title}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={total} height={total} fill="#ffffff" />
      {rects.map((pos) => {
        const [x, y] = pos.split(",");
        return <rect key={pos} x={x} y={y} width={1} height={1} fill="#0b2f6b" />;
      })}
    </svg>
  );
}
