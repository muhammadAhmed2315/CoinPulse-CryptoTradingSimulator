import { cn } from "@/lib/utils";

// ===== ICON =====
// Inline so fill/stroke follow the active theme. Uses neutral muted tones
// (no red) so it reads as "no content yet" rather than "something broke".
// Shows a stylized chart + plus to suggest "start trading".
function NoTradesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={48}
      height={48}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path
        d="M3 19.5h18M3 19.5V5"
        className="stroke-muted-foreground/50"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M6.5 16l3.5-4.5 3 3 4-6"
        className="stroke-muted-foreground/60"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="18.5"
        cy="6.5"
        r="2.75"
        className="fill-muted stroke-muted-foreground/50"
        strokeWidth={1.5}
      />
      <path
        d="M18.5 5.25v2.5M17.25 6.5h2.5"
        className="stroke-muted-foreground/70"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ===== TYPES =====
type NoTradesFallbackProps = {
  title?: string;
  description?: string;
  className?: string;
};

export default function NoTradesFallback({
  title = "No trades yet",
  description = "Place your first trade to see it appear here.",
  className,
}: NoTradesFallbackProps) {
  return (
    <div
      className={cn(
        "w-full flex flex-col items-center justify-center gap-3 py-20 px-3 text-center",
        className,
      )}
    >
      <NoTradesIcon />
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-foreground leading-tight">
          {title}
        </p>
        <p className="text-sm text-muted-foreground/70 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
