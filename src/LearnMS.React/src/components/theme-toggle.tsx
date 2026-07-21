"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <div
      dir="ltr"
      className={cn(
        "relative flex h-8 w-16 shrink-0 cursor-pointer rounded-full border border-border p-1 transition-all duration-300",
        isDark ? "bg-secondary" : "bg-background",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      role="button"
      tabIndex={0}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setTheme(isDark ? "light" : "dark");
        }
      }}
    >
      {/* Track icons */}
      <div className="pointer-events-none absolute inset-1 flex items-center justify-between px-0.5">
        <Sun className="size-4 text-muted-foreground" strokeWidth={1.5} />
        <Moon className="size-4 text-muted-foreground" strokeWidth={1.5} />
      </div>

      {/* Thumb — absolute + dir=ltr so Arabic RTL cannot shift it */}
      <div
        className={cn(
          "absolute top-1 flex size-6 items-center justify-center rounded-full transition-all duration-300",
          isDark ? "left-auto right-1 bg-primary" : "left-1 right-auto bg-secondary"
        )}
      >
        {isDark ? (
          <Moon className="size-4 text-primary-foreground" strokeWidth={1.5} />
        ) : (
          <Sun className="size-4 text-secondary-foreground" strokeWidth={1.5} />
        )}
      </div>
    </div>
  );
}
