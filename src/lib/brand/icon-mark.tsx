import type { ReactElement } from "react";

/**
 * The UJC logogram, drawn as plain elements so `ImageResponse` can rasterise it
 * to PNG at any size. It mirrors public/icon.svg: a navy tile, the torii-like
 * crossbars, and a gold centre standing in for the kizuna knot.
 *
 * `padding` carves out the safe zone a maskable icon needs — Android crops
 * maskable icons to whatever shape the launcher uses, so the mark has to sit
 * well inside the canvas.
 */
export function IconMark({
  size,
  padding = 0,
  rounded = true,
}: {
  size: number;
  padding?: number;
  rounded?: boolean;
}): ReactElement {
  const inner = size - padding * 2;
  const unit = inner / 32;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1E3A8A",
      }}
    >
      <div
        style={{
          width: inner,
          height: inner,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1E3A8A",
          borderRadius: rounded ? unit * 9 : 0,
          gap: unit * 1.6,
        }}
      >
        {/* two crossbars */}
        <div
          style={{
            width: unit * 18,
            height: unit * 1.9,
            background: "#FFFFFF",
            borderRadius: unit,
          }}
        />
        <div
          style={{
            width: unit * 15,
            height: unit * 1.9,
            background: "#FFFFFF",
            borderRadius: unit,
          }}
        />
        {/* gold knot */}
        <div
          style={{
            width: unit * 5.2,
            height: unit * 5.2,
            background: "#D4A017",
            borderRadius: unit * 3,
            marginTop: unit * 0.6,
          }}
        />
      </div>
    </div>
  );
}
