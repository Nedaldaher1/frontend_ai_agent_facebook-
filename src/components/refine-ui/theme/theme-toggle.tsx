"use client";

import {
  useIsDarkMode,
  useTheme,
} from "@/components/refine-ui/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

type ThemeToggleProps = {
  className?: string;
};

/**
 * A binary light <-> dark theme switch. When the stored preference is
 * "system", {@link useIsDarkMode} resolves the currently-rendered theme from
 * the OS so the very first click flips to the opposite of what the user sees.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { setTheme } = useTheme();
  const isDark = useIsDarkMode();

  const label = isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        "rounded-full",
        "border-sidebar-border",
        "bg-transparent",
        className,
        "h-10",
        "w-10"
      )}
    >
      <Sun
        className={cn(
          "h-[1.2rem]",
          "w-[1.2rem]",
          "transition-all",
          "duration-200",
          isDark ? "-rotate-90 scale-0" : "rotate-0 scale-100"
        )}
      />
      <Moon
        className={cn(
          "absolute",
          "h-[1.2rem]",
          "w-[1.2rem]",
          "transition-all",
          "duration-200",
          isDark ? "rotate-0 scale-100" : "rotate-90 scale-0"
        )}
      />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

ThemeToggle.displayName = "ThemeToggle";
