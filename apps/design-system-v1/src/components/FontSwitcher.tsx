import { useCallback, useEffect, useState } from "react";
import { cn } from "@/utils/cn";

interface FontSet {
  label: string;
  display: string;
  mono: string;
  uppercase?: boolean;
}

const FONT_SETS: Array<FontSet> = [
  /* Sans + Mono */
  { label: "IBM Plex", display: "'IBM Plex Sans', sans-serif", mono: "'IBM Plex Mono', monospace" },
  { label: "Red Hat", display: "'Red Hat Display', sans-serif", mono: "'Red Hat Mono', monospace" },
  { label: "Barlow + Fira", display: "'Barlow', sans-serif", mono: "'Fira Mono', monospace" },
  { label: "Manrope + JetBrains", display: "'Manrope', sans-serif", mono: "'JetBrains Mono', monospace" },
  { label: "Albert + Plex Mono", display: "'Albert Sans', sans-serif", mono: "'IBM Plex Mono', monospace" },
  /* Unconventional */
  { label: "Audiowide + Share Tech", display: "'Audiowide', sans-serif", mono: "'Share Tech Mono', monospace", uppercase: true },
  { label: "Audiowide + JetBrains", display: "'Audiowide', sans-serif", mono: "'JetBrains Mono', monospace", uppercase: true },
  { label: "Orbitron + JetBrains", display: "'Orbitron', sans-serif", mono: "'JetBrains Mono', monospace" },
  { label: "Rajdhani + Fira", display: "'Rajdhani', sans-serif", mono: "'Fira Mono', monospace" },
  { label: "Oxanium + Plex Mono", display: "'Oxanium', sans-serif", mono: "'IBM Plex Mono', monospace" },
  { label: "Saira + Fira", display: "'Saira', sans-serif", mono: "'Fira Mono', monospace" },
];

const STORAGE_KEY = "resequence-ds-fonts";

function applyFonts(fontSet: FontSet) {
  document.documentElement.style.setProperty("--font-display", fontSet.display);
  document.documentElement.style.setProperty("--font-mono", fontSet.mono);
  document.documentElement.style.setProperty("--display-transform", fontSet.uppercase === true ? "uppercase" : "none");
  document.documentElement.style.setProperty("--display-letter-spacing", fontSet.uppercase === true ? "0.05em" : "normal");
}

export default function FontSwitcher() {
  const [activeIndex, setActiveIndex] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored !== null ? Number(stored) : 0;

    return Number.isFinite(parsed) ? parsed : 0;
  });

  useEffect(() => {
    const fontSet = FONT_SETS[activeIndex];

    if (fontSet) {
      applyFonts(fontSet);
      localStorage.setItem(STORAGE_KEY, String(activeIndex));
    }
  }, [activeIndex]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + FONT_SETS.length) % FONT_SETS.length);
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % FONT_SETS.length);
  }, []);

  const currentSet = FONT_SETS[activeIndex];

  return (
    <div className="flex items-center gap-[6px] rounded border border-border-subtle bg-surface-2 px-[6px] py-[2px]">
      <button
        onClick={handlePrev}
        className="text-text-secondary hover:text-text-primary"
        aria-label="Previous font"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span
        className={cn(
          "min-w-[120px] text-center text-[0.625rem] leading-[1rem] text-text-primary",
        )}
        style={{ fontFamily: currentSet?.display }}
      >
        {currentSet?.label}
      </span>
      <button
        onClick={handleNext}
        className="text-text-secondary hover:text-text-primary"
        aria-label="Next font"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
