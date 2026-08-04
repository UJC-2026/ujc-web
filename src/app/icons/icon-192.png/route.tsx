import { ImageResponse } from "next/og";
import { IconMark } from "@/lib/brand/icon-mark";

// Generated once at build time rather than per request.
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(<IconMark size={192} />, {
    width: 192,
    height: 192,
  });
}
