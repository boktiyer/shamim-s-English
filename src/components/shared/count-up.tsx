"use client";

import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  value: number;
  /** Text after the number, e.g. "+" */
  suffix?: string;
  /** "full" = 1,520 · "compact" = 1.5K */
  format?: "full" | "compact";
  durationMs?: number;
  className?: string;
};

const formatters = {
  full: new Intl.NumberFormat("en"),
  compact: new Intl.NumberFormat("en", { notation: "compact" }),
};

/** Counts from 0 up to `value` the first time it scrolls into view. */
export function CountUp({ value, suffix = "", format = "full", durationMs = 1600, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - t, 3);
          setShown(Math.round(value * eased));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className} aria-label={`${formatters[format].format(value)}${suffix}`}>
      <span aria-hidden className="tabular-nums">
        {formatters[format].format(shown)}
        {suffix}
      </span>
    </span>
  );
}
