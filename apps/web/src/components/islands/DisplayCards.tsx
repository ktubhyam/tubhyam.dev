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
        "relative flex h-36 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl border",
        "bg-[#111111]/70 backdrop-blur-sm px-4 py-3 transition-all duration-700",
        "after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem]",
        "after:bg-gradient-to-l after:from-[#000000] after:to-transparent after:content-[''] after:pointer-events-none",
        "hover:border-white/20 hover:bg-[#141414]",
        "[&>*]:flex [&>*]:items-center [&>*]:gap-2",
        "no-underline cursor-pointer",
        className,
      )}
      style={{ borderColor: "#1F1F1F" }}
    >
      <div>
        <span style={{ color: accentColor }}>
          {/* Article / document icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="size-4 shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </span>
        <p
          className="text-xs font-medium font-mono leading-snug line-clamp-2"
          style={{ color: accentColor }}
        >
          {title}
        </p>
      </div>
      <p className="text-[10px] text-[#555555] line-clamp-2 leading-relaxed">
        {description}
      </p>
      <p className="text-[10px] font-mono text-[#555555]/60">{date}</p>
    </a>
  );
}

// Per-card stack positioning: front card is plain, middle and back cards are
// offset to the right and start greyscale (clearing on hover).
const STACK_CLASS = [
  // front — lifted on hover, no greyscale
  "[grid-area:stack] hover:-translate-y-10 transition-all duration-700 z-[3]",
  // middle — offset right, greyscale cleared on hover
  "[grid-area:stack] hover:-translate-y-10 transition-all duration-700 z-[2] translate-x-8 translate-y-3 grayscale hover:grayscale-0",
  // back — further offset, greyscale cleared on hover
  "[grid-area:stack] hover:-translate-y-10 transition-all duration-700 z-[1] translate-x-16 translate-y-6 grayscale hover:grayscale-0",
];

export interface DisplayCardsProps {
  cards: DisplayCardData[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  return (
    <div className="grid [grid-template-areas:'stack'] place-items-start opacity-100">
      {cards.slice(0, 3).map((card, i) => (
        <DisplayCard
          key={card.href}
          {...card}
          className={STACK_CLASS[i] ?? STACK_CLASS[0]}
        />
      ))}
    </div>
  );
}
