import { ImageResponse } from "next/og";
import { IconMark } from "@/lib/brand/icon-mark";

export const dynamic = "force-static";

/**
 * Maskable variant: the launcher crops this to its own shape, so the mark is
 * padded into the safe zone and the tile corners stay square.
 */
export function GET() {
  return new ImageResponse(
    <IconMark size={512} padding={56} rounded={false} />,
    { width: 512, height: 512 },
  );
}
