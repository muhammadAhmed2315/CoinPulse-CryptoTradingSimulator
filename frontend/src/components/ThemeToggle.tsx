import { Moon, Sun } from "lucide-react";
import { useId } from "react";
import { useTheme } from "@/context/theme-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ===== ICONS =====
// lucide's gear (Settings) path + its center hole, reused for the System theme icon.
const GEAR_PATH =
  "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915";
const HOLE_PATH = "M12 9A3 3 0 1 0 12 15A3 3 0 1 0 12 9Z";

/**
 * A settings cog whose left half is filled solid (center hole preserved) and whose
 * right half is outline only — a "half light / half dark" gear for the System theme.
 */
function SystemThemeIcon({ className }: { className?: string }) {
  const clipId = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="12" height="24" />
        </clipPath>
      </defs>
      {/* filled left half (gear minus its center hole) */}
      <path
        d={`${GEAR_PATH} ${HOLE_PATH}`}
        fill="currentColor"
        fillRule="evenodd"
        stroke="none"
        clipPath={`url(#${clipId})`}
      />
      {/* full gear outline drawn on top */}
      <path d={GEAR_PATH} />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ===== CONSTANTS =====
const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: SystemThemeIcon },
] as const;

export default function ThemeToggle() {
  // ===== STATE VARIABLES =====
  const { theme, setTheme } = useTheme();

  // ===== DERIVED STATE =====
  const CurrentIcon =
    THEME_OPTIONS.find((option) => option.value === theme)?.icon ??
    SystemThemeIcon;

  return (
    <DropdownMenu>
      {/* ===== TRIGGER BUTTON ===== */}
      <DropdownMenuTrigger
        aria-label="Change theme"
        className="inline-flex items-center justify-center size-10 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors cursor-pointer outline-none"
      >
        <CurrentIcon className="size-4" />
      </DropdownMenuTrigger>

      {/* ===== THEME OPTIONS MENU ===== */}
      <DropdownMenuContent align="center" sideOffset={8} className="w-35">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isActive = theme === value;
          return (
            <DropdownMenuItem
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                "cursor-pointer gap-2",
                isActive && "bg-accent font-semibold text-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
