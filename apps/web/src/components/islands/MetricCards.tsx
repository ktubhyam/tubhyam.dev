/**
 * MetricCards — Animated stat cards with tiny sparkline charts.
 * Each card shows a metric value that counts up + a mini sparkline.
 * Staggered reveal animation on scroll.
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useInView } from "motion/react";

interface Metric {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  color: string;
  sparkline: number[]; // 0-1 normalized values
  trend?: "up" | "down" | "stable";
}

interface Props {
  metrics?: Metric[];
  className?: string;
}

const DEFAULT_METRICS: Metric[] = [
  {
    label: "Target R²",
    value: 0.95,
    color: "#34D399",
    sparkline: [0.0, 0.0, 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.7, 0.95],
    trend: "up",
  },
  {
    label: "QM9S Dataset",
    value: 130,
    suffix: "K",
    color: "#4ECDC4",
    sparkline: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.8, 1.0],
    trend: "up",
  },
  {
    label: "GPU Hours",
    value: 0,
    suffix: "",
    color: "#C9A04A",
    sparkline: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    trend: "stable",
  },
  {
    label: "Papers WIP",
    value: 2,
    suffix: "",
    color: "#A78BFA",
    sparkline: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.5, 1.0, 1.0],
    trend: "up",
  },
];

function Sparkline({ data, color, width = 60, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
  const path = useMemo(() => {
    if (data.length < 2) return "";
    const step = width / (data.length - 1);
    const points = data.map((v, i) => `${i * step},${height - v * height}`);
    return `M${points.join(" L")}`;
  }, [data, width, height]);

  const fillPath = useMemo(() => {
    if (data.length < 2) return "";
    const step = width / (data.length - 1);
    const points = data.map((v, i) => `${i * step},${height - v * height}`);
    return `M0,${height} L${points.join(" L")} L${width},${height} Z`;
  }, [data, width, height]);

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <defs>
        <linearGradient id={`sparkGrad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#sparkGrad-${color.replace("#", "")})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MetricCards({
  metrics = DEFAULT_METRICS,
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let frame: number;
    let start: number | null = null;
    const duration = 1200;

    function animate(timestamp: number) {
      if (!start) start = timestamp;
      const p = Math.min((timestamp - start) / duration, 1);
      // Ease out cubic
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) frame = requestAnimationFrame(animate);
    }

    const delay = setTimeout(() => {
      frame = requestAnimationFrame(animate);
    }, 300);

    return () => {
      clearTimeout(delay);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isInView]);

  return (
    <div ref={ref} className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
      {metrics.map((metric, i) => {
        const currentValue = metric.value * progress;
        const displayValue = metric.value < 1
          ? currentValue.toFixed(3)
          : Math.round(currentValue).toString();

        const trendIcon = metric.trend === "up" ? "↑" : metric.trend === "down" ? "↓" : "→";
        const trendLabel = metric.trend === "down" && metric.label === "Latency" ? "good" : metric.trend === "up" ? "good" : "";

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border border-border bg-bg-secondary p-4 flex flex-col gap-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-text-muted/70 uppercase tracking-wider">{metric.label}</span>
              <span className="text-[9px] font-mono" style={{ color: metric.color }}>
                {trendIcon} {trendLabel}
              </span>
            </div>

            {/* Value + Sparkline */}
            <div className="flex items-end justify-between gap-2">
              <span className="text-xl font-heading font-bold" style={{ color: metric.color }}>
                {metric.prefix}{displayValue}{metric.suffix}
              </span>
              <Sparkline data={metric.sparkline} color={metric.color} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
