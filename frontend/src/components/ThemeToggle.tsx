import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/context/theme-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ===== CONSTANTS =====
const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function ThemeToggle() {
  // ===== STATE VARIABLES =====
  const { theme, resolvedTheme, setTheme } = useTheme();

  // ===== DERIVED STATE =====
  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      {/* ===== TRIGGER BUTTON ===== */}
      <DropdownMenuTrigger
        aria-label="Change theme"
        className="inline-flex items-center justify-center size-10 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors cursor-pointer outline-none"
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
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
