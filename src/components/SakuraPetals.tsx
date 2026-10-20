import { useEffect, useState } from "react";

type Petal = {
  left: number;
  size: number;
  dur: number;
  delay: number;
  drift: number;
  spin: number;
  sway: number;
};

export function SakuraPetals() {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const count = window.innerWidth < 640 ? 10 : window.innerWidth < 1024 ? 18 : 28;
    setPetals(
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        size: 8 + Math.random() * 12,
        dur: 10 + Math.random() * 14,
        delay: -Math.random() * 20,
        drift: (Math.random() - 0.3) * 200,
        spin: 300 + Math.random() * 500,
        sway: 3 + Math.random() * 4,
      })),
    );
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {petals.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.8,
              animationDuration: `${p.dur}s, ${p.sway}s`,
              animationDelay: `${p.delay}s, 0s`,
              "--drift": `${p.drift}px`,
              "--spin": `${p.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
