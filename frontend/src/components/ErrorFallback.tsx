import { cn } from "@/lib/utils";

// ===== ICON =====
// Inline so fill/stroke follow the active theme. In light mode the triangle keeps
// its soft red tint; in dark mode the near-white interior becomes a translucent red
// and the outline lightens for contrast against dark cards.
function WarningTriangleIcon({ className }: { className?: string }) {
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
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        className="fill-red-50 stroke-red-500 dark:fill-red-500/10 dark:stroke-red-400"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <line
        x1="12"
        y1="9"
        x2="12"
        y2="13"
        className="stroke-red-600 dark:stroke-red-400"
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="16.5"
        r="1"
        className="fill-red-600 dark:fill-red-400"
      />
    </svg>
  );
}

// ===== TYPES =====
type ErrorFallbackSize = "sm" | "md" | "lg";

type ErrorFallbackBase = {
  className?: string;
  horizontal?: boolean;
  size?: ErrorFallbackSize;
};

type ErrorFallbackProps = ErrorFallbackBase &
  (
    | { title: string; description?: string }
    | { title?: string; description: string }
  );

// ===== CONSTANTS =====
const SIZE_STYLES: Record<
  ErrorFallbackSize,
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

export default function ErrorFallback({
  title,
  description,
  horizontal = false,
  size = "lg",
  className,
}: ErrorFallbackProps) {
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
      <WarningTriangleIcon className={sizeStyles.icon} />
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
