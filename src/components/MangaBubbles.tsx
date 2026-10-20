import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const BUBBLES = [
  {
    text: "POW!",
    className: "left-[4%] top-[18%] -rotate-12 bg-primary text-primary-foreground",
    mobile: false,
  },
  { text: "KAWAII!", className: "right-[6%] top-[14%] rotate-6 bg-sakura text-ink", mobile: true },
  {
    text: "SUGOI!",
    className: "right-[12%] bottom-[18%] -rotate-6 bg-paper text-ink",
    mobile: false,
  },
];

export function MangaBubbles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const reduce = useReducedMotion();

  if (!mounted) {
    return <div aria-hidden className="pointer-events-none absolute inset-0 z-10" />;
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {BUBBLES.map((b, i) => (
        <motion.span
          key={b.text}
          className={`absolute ${b.mobile ? "block" : "hidden md:block"} ${b.className} font-display border-2 border-ink px-4 py-2 text-lg shadow-[4px_4px_0_0_var(--ink)] md:text-2xl`}
          style={{
            clipPath: "polygon(0 0,100% 0,100% 78%,30% 78%,18% 100%,20% 78%,0 78%)",
            paddingBottom: "1.1rem",
          }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={
            reduce
              ? { opacity: 1, scale: 1 }
              : { opacity: 1, scale: [1, 1.06, 1], y: [0, -12, 0], x: [0, 6, 0] }
          }
          transition={
            reduce
              ? { duration: 0.3 }
              : { duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }
          }
        >
          {b.text}
        </motion.span>
      ))}
    </div>
  );
}
