import { cn } from "@/lib/utils";

// ===== ICON =====
// Inline so fill/stroke follow the active theme. Uses neutral muted tones
// (no red) so it reads as "no content yet" rather than "something broke".
function EmptyContentIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={36}
      height={36}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path
        d="M4 4.5A1.5 1.5 0 0 1 5.5 3h9.379a1.5 1.5 0 0 1 1.06.44l3.621 3.62a1.5 1.5 0 0 1 .44 1.061V19.5A1.5 1.5 0 0 1 18.5 21h-13A1.5 1.5 0 0 1 4 19.5v-15z"
        className="fill-muted stroke-muted-foreground/50 dark:fill-muted/30 dark:stroke-muted-foreground/60"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d="M15 3v4.5a1 1 0 0 0 1 1h4.5"
        className="stroke-muted-foreground/50 dark:stroke-muted-foreground/60"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d="M8 11h8M8 14h8M8 17h5"
        className="stroke-muted-foreground/60 dark:stroke-muted-foreground/70"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ===== TYPES =====
type EmptyFallbackSize = "sm" | "md" | "lg";

type EmptyFallbackBase = {
  className?: string;
  horizontal?: boolean;
  size?: EmptyFallbackSize;
};

type EmptyFallbackProps = EmptyFallbackBase &
  (
    | { title: string; description?: string }
    | { title?: string; description: string }
  );

// ===== CONSTANTS =====
const SIZE_STYLES: Record<
  EmptyFallbackSize,
  { icon: string; title: string; description: string }
> = {
  sm: {
    icon: "h-3.5 w-3.5",
    title: "text-xs font-medium",
    description: "text-xs",
  },
  md: {
    icon: "",
    title: "text-sm font-medium",
    description: "text-xs",
  },
  lg: {
    icon: "size-12",
    title: "text-base font-medium",
    description: "text-sm",
  },
};

export default function EmptyFallback({
  title,
  description,
  horizontal = false,
  size = "lg",
  className,
}: EmptyFallbackProps) {
  // ===== DERIVED STATE =====
  const sizeStyles = SIZE_STYLES[size];
  return (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center gap-2.5",
        horizontal ? "flex-row" : "flex-col py-5 px-3 text-center",
        className,
      )}
    >
      <EmptyContentIcon className={sizeStyles.icon} />
      <div>
        {title && (
          <p className={cn("text-foreground leading-tight", sizeStyles.title)}>
            {title}
          </p>
        )}
        {description && (
          <p
            className={cn(
              "text-muted-foreground/70 leading-relaxed",
              sizeStyles.description,
            )}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
