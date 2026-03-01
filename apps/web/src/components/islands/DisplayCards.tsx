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

// Text shadow punches text out of the background without blurring the whole card
const TITLE_SHADOW = "0 1px 8px rgba(0,0,0,0.95), 0 0 16px rgba(0,0,0,0.85)";
const BODY_SHADOW  = "0 1px 5px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.80)";

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
        "flex-1 min-w-0 h-56 -skew-y-[8deg] select-none",
        // Fully transparent — three-body animation shows through
        "bg-transparent px-5 py-5 transition-all duration-500",
        "hover:-translate-y-4",
        "no-underline cursor-pointer",
        className,
      )}
      style={{ borderColor: "rgba(255,255,255,0.07)" }}
    >
      {/* Icon + title */}
      <div className="flex items-start gap-2">
        <span style={{ color: accentColor, filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.9))" }}
              className="mt-0.5 shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
               className="size-3.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </span>
        <p
          className="text-[10px] font-semibold font-mono leading-snug line-clamp-3"
          style={{ color: accentColor, textShadow: TITLE_SHADOW }}
        >
          {title}
        </p>
      </div>

      {/* Description */}
      <p
        className="text-[9px] text-[#aaaaaa] line-clamp-3 leading-relaxed"
        style={{ textShadow: BODY_SHADOW }}
      >
        {description}
      </p>

      {/* Date */}
      <p
        className="text-[9px] font-mono text-[#777777]"
        style={{ textShadow: BODY_SHADOW }}
      >
        {date}
      </p>
    </a>
  );
}

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
          className={STAGGER_CLASS[i] ?? ""}
        />
      ))}
    </div>
  );
}
