import { cn } from "@lib/utils";

export interface DisplayCardData {
  title: string;
  description: string;
  date: string;
  href: string;
  accentColor: string;
}

interface DisplayCardProps extends DisplayCardData {
  className?: string;
}

function DisplayCard({
  className,
  title,
  description,
  date,
  href,
  accentColor,
}: DisplayCardProps) {
  return (
    <a
      href={href}
      className={cn(
        "relative flex flex-col justify-between rounded-xl border",
        "flex-1 min-w-0 h-48 -skew-y-[8deg] select-none",
        "bg-[#111111]/80 backdrop-blur-sm px-4 py-4 transition-all duration-500",
        "hover:-translate-y-4 hover:border-white/20 hover:bg-[#141414]",
        "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[35%]",
        "after:bg-gradient-to-l after:from-[#000000] after:to-transparent",
        "after:content-[''] after:pointer-events-none after:rounded-r-xl",
        "no-underline cursor-pointer",
        className,
      )}
      style={{ borderColor: "#1F1F1F" }}
    >
      {/* Icon + title */}
      <div className="flex items-start gap-2">
        <span style={{ color: accentColor }} className="mt-0.5 shrink-0">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="size-3.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </span>
        <p
          className="text-[10px] font-semibold font-mono leading-snug line-clamp-3"
          style={{ color: accentColor }}
        >
          {title}
        </p>
      </div>

      {/* Description */}
      <p className="text-[9px] text-[#555555] line-clamp-3 leading-relaxed">
        {description}
      </p>

      {/* Date */}
      <p className="text-[9px] font-mono text-[#555555]/50">{date}</p>
    </a>
  );
}

// 5-card accent palette: amber → teal → violet → green → amber-soft
const ACCENT_COLORS = ["#C9A04A", "#4ECDC4", "#A78BFA", "#34D399", "#C9A04A"];

// Diagonal cascade: each card 3 steps lower than the previous
const STAGGER_CLASS = ["", "mt-3", "mt-6", "mt-9", "mt-12"];

export interface DisplayCardsProps {
  cards: DisplayCardData[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  return (
    <div className="flex items-start gap-3 w-full">
      {cards.slice(0, 5).map((card, i) => (
        <DisplayCard
          key={card.href}
          {...card}
          accentColor={card.accentColor || ACCENT_COLORS[i]}
          className={STAGGER_CLASS[i] ?? ""}
        />
      ))}
    </div>
  );
}
