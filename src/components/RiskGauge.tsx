import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

export function RiskGauge({ score, size = 180 }: { score: number; size?: number }) {
  const v = useMotionValue(0);
  const display = useTransform(v, (val) => Math.round(val));
  useEffect(() => {
    const controls = animate(v, score, { duration: 1.2, ease: "easeOut" });
    return () => controls.stop();
  }, [score, v]);

  const level = score >= 71 ? { label: "HIGH", color: "var(--destructive)" } : score >= 31 ? { label: "MEDIUM", color: "var(--warning)" } : { label: "LOW", color: "var(--success)" };
  const r = (size - 24) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={10} className="text-muted/40" fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={level.color} strokeWidth={10} fill="none" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 12px ${level.color})` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <motion.div className="text-4xl font-bold font-display tabular-nums">{display}</motion.div>
          <div className="text-[10px] uppercase tracking-widest" style={{ color: level.color }}>{level.label} RISK</div>
        </div>
      </div>
    </div>
  );
}
