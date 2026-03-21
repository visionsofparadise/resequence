import { useDrag } from "@use-gesture/react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/utils/cn";

const DB_TICKS = [
  { label: "0", position: 1.0 },
  { label: "-6", position: 0.75 },
  { label: "-12", position: 0.5 },
  { label: "-24", position: 0.25 },
  { label: "-48", position: 0.1 },
  { label: "-\u221E", position: 0.0 },
];

interface GainFaderProps {
  value: number;
  onChange: (value: number) => void;
  height?: number;
  className?: string;
}

function clampValue(input: number): number {
  return Math.min(1, Math.max(0, input));
}

const THUMB_WIDTH = 22;
const THUMB_HEIGHT = 48;


export function GainFader({
  value,
  onChange,
  height = 120,
  className,
}: GainFaderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef(value);
  const [isDragging, setIsDragging] = useState(false);

  valueRef.current = value;

  const handleDrag = useCallback(
    (deltaY: number, shiftKey: boolean) => {
      const sensitivity = shiftKey ? 0.00125 : 0.005;
      const next = clampValue(valueRef.current - deltaY * sensitivity);

      onChange(next);
    },
    [onChange],
  );

  const bind = useDrag(
    ({ delta: [, dy], shiftKey, first, last }) => {
      if (first) setIsDragging(true);
      if (last) setIsDragging(false);

      handleDrag(dy, shiftKey);
    },
    { filterTaps: true },
  );

  const handleTrackClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const track = trackRef.current;

      if (!track) {
        return;
      }

      const rect = track.getBoundingClientRect();
      const yy = event.clientY - rect.top;
      const next = clampValue(1 - yy / rect.height);

      onChange(next);
    },
    [onChange],
  );

  const handleDoubleClick = useCallback(() => {
    onChange(1.0);
  }, [onChange]);

  const halfThumb = THUMB_HEIGHT / 2;
  const travelRange = height - THUMB_HEIGHT;
  const thumbY = (1 - value) * travelRange;
  const fillHeight = value * height;

  const thumbShadow = isDragging
    ? "0 3px 8px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4), inset 1px 1px 0 rgba(255,255,255,0.1), inset -1px -1px 0 rgba(0,0,0,0.25), 0 0 8px var(--gold-glow)"
    : "0 3px 8px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4), inset 1px 1px 0 rgba(255,255,255,0.1), inset -1px -1px 0 rgba(0,0,0,0.25)";

  return (
    <div
      className={cn("flex items-stretch gap-[8px]", className)}
      style={{ height }}
    >
      {/* dB tick labels — inset by half thumb to align with thumb center */}
      <div className="relative flex w-[24px] flex-col justify-between" style={{ height }}>
        {DB_TICKS.map((tick) => (
          <span
            key={tick.label}
            className="label-caps text-right font-mono text-text-tertiary"
            style={{
              position: "absolute",
              top: halfThumb + (1 - tick.position) * travelRange,
              right: 0,
              transform: "translateY(-50%)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {tick.label}
          </span>
        ))}
      </div>

      {/* Track and thumb */}
      <div className="relative flex items-center" style={{ width: THUMB_WIDTH + 4 }}>
        {/* Track channel — recessed slot */}
        <div
          ref={trackRef}
          className="absolute left-1/2 w-[6px] -translate-x-1/2 rounded-[3px]"
          style={{
            height,
            background: "var(--surface-0)",
            boxShadow: "var(--shadow-inset-md), inset 0 0 0 1px rgba(0,0,0,0.3)",
          }}
          onClick={handleTrackClick}
        >
          {/* Gold fill from bottom */}
          <div
            className="absolute bottom-0 left-0 w-full rounded-[3px] bg-gold-500"
            style={{ height: fillHeight, opacity: 0.8 }}
          />
        </div>

        {/* Tick marks — inset by half thumb to align with thumb center */}
        {DB_TICKS.map((tick) => (
          <div
            key={`mark-${tick.label}`}
            className="absolute bg-border-subtle"
            style={{
              width: 6,
              height: 1,
              left: 2,
              top: halfThumb + (1 - tick.position) * travelRange,
            }}
          />
        ))}
        {DB_TICKS.map((tick) => (
          <div
            key={`mark-r-${tick.label}`}
            className="absolute bg-border-subtle"
            style={{
              width: 6,
              height: 1,
              right: 2,
              top: halfThumb + (1 - tick.position) * travelRange,
            }}
          />
        ))}

        {/* Fader thumb — tall cap with deep grip ridges and center indicator */}
        <div
          className="absolute left-1/2 -translate-x-1/2 select-none touch-none"
          style={{
            top: thumbY,
            width: THUMB_WIDTH,
            height: THUMB_HEIGHT,
            borderRadius: 3,
            background: `
              linear-gradient(to bottom,
                rgba(0,0,0,0.15) 0%,
                rgba(255,255,255,0.1) 12%,
                rgba(255,255,255,0.06) 30%,
                transparent 42%,
                rgba(0,0,0,0.1) 47%,
                rgba(0,0,0,0.15) 50%,
                rgba(0,0,0,0.1) 53%,
                transparent 58%,
                rgba(255,255,255,0.06) 70%,
                rgba(255,255,255,0.1) 88%,
                rgba(0,0,0,0.15) 100%
              ),
              linear-gradient(to bottom, var(--surface-3), var(--surface-2))
            `,
            borderTop: `1px solid ${isDragging ? "var(--gold-500)" : "rgba(255,255,255,0.08)"}`,
            borderLeft: `1px solid ${isDragging ? "var(--gold-500)" : "rgba(255,255,255,0.06)"}`,
            borderRight: `1px solid ${isDragging ? "var(--gold-500)" : "rgba(0,0,0,0.3)"}`,
            borderBottom: `1px solid ${isDragging ? "var(--gold-500)" : "rgba(0,0,0,0.35)"}`,
            boxShadow: thumbShadow,
            transition: "box-shadow 0.15s ease, border-color 0.15s ease",
          }}
          onDoubleClick={handleDoubleClick}
          {...bind()}
        >
          {/* Center indicator line — thin gold line across the middle */}
          <div
            className="absolute left-[4px] right-[4px] top-1/2 -translate-y-1/2"
            style={{
              height: 1.5,
              background: "var(--gold-500)",
              borderRadius: 1,
              boxShadow: "0 0 3px rgba(196, 153, 60, 0.3)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
