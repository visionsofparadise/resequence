import { useCallback, useEffect, useState } from "react";
import { cn } from "@/utils/cn";

type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "resequence-ds-theme";

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);

  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

const OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;

    return stored ?? "system";
  });

  useEffect(() => {
    applyTheme(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (mode === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handler);

    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, [mode]);

  const handleSelect = useCallback((selected: ThemeMode) => {
    setMode(selected);
  }, []);

  return (
    <div className="flex items-center gap-0 rounded border border-border-subtle bg-surface-2 p-[2px]">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => {
            handleSelect(option.value);
          }}
          className={cn(
            "relative px-[8px] py-[2px] text-[0.6875rem] leading-[1rem] transition-colors",
            mode === option.value
              ? "text-gold-500 after:absolute after:bottom-0 after:left-[4px] after:right-[4px] after:h-[1px] after:bg-gold-500"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
