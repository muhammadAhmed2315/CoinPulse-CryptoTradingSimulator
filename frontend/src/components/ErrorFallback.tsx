import RedWarningIcon from "@/assets/icons/warning-red.svg";
import { cn } from "@/lib/utils";

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
      <img src={RedWarningIcon} className={sizeStyles.icon} />
      <div>
        {title && (
          <p className={cn("text-gray-800 leading-tight", sizeStyles.title)}>
            {title}
          </p>
        )}
        {description && (
          <p
            className={cn(
              "text-gray-400 leading-relaxed",
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
