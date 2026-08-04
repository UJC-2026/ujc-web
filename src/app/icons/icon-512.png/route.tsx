import { ImageResponse } from "next/og";
import { IconMark } from "@/lib/brand/icon-mark";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(<IconMark size={512} />, {
    width: 512,
    height: 512,
  });
}
