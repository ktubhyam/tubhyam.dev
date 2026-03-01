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
        "flex-1 min-w-0 h-44 -skew-y-[8deg] select-none",
        "bg-[#111111]/70 backdrop-blur-sm px-5 py-4 transition-all duration-500",
        "hover:-translate-y-3 hover:border-white/20 hover:bg-[#141414]",
        "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[40%]",
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
            className="size-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </span>
        <p
          className="text-xs font-semibold font-mono leading-snug line-clamp-2"
          style={{ color: accentColor }}
        >
          {title}
        </p>
      </div>

      {/* Description */}
      <p className="text-[10px] text-[#555555] line-clamp-3 leading-relaxed">
        {description}
      </p>

      {/* Date */}
      <p className="text-[10px] font-mono text-[#555555]/60">{date}</p>
    </a>
  );
}

export interface DisplayCardsProps {
  cards: DisplayCardData[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  return (
    // Diagonal cascade: each card slightly lower than the previous
    <div className="flex items-start gap-4 w-full">
      {cards.slice(0, 3).map((card, i) => (
        <DisplayCard
          key={card.href}
          {...card}
          className={cn(
            i === 1 && "mt-8",
            i === 2 && "mt-16",
          )}
        />
      ))}
    </div>
  );
}
