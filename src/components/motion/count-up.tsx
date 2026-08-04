"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

export function CountUp({
  value,
  duration = 1600,
  suffix = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const totalMs = reduced ? 0 : duration;
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = totalMs <= 0 ? 1 : Math.min((now - start) / totalMs, 1);
      // ease-out-cubic so the number decelerates into its final value
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref}>
      {display.toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}
