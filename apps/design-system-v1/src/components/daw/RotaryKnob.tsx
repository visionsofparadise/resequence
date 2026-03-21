import { useDrag } from "@use-gesture/react";
import { cva, type VariantProps } from "class-variance-authority";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/utils/cn";

const knobVariants = cva("relative rounded-full", {
  variants: {
    size: {
      small: "",
      default: "",
      large: "",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const BODY_PX: Record<string, number> = {
  small: 28,
  default: 40,
  large: 56,
};

const ARC_DEGREES = 270;
const ARC_START_OFFSET = 135;

interface RotaryKnobProps extends VariantProps<typeof knobVariants> {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  bipolar?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
}

function clampValue(input: number): number {
  return Math.min(1, Math.max(0, input));
}

/* Ribbed skirt — 24 wide ridges with strong contrast.
   Each ridge is a light face + dark groove, like the real knobs in the reference photos. */
function buildSkirtGradient(): string {
  const stops: Array<string> = [];
  const ridgeCount = 24;
  const ridgeDeg = 360 / ridgeCount;

  for (let ii = 0; ii < ridgeCount; ii++) {
    const start = ii * ridgeDeg;
    const grooveEnd = start + ridgeDeg * 0.35;
    const faceEnd = start + ridgeDeg;

    stops.push(`rgba(0,0,0,0.1) ${String(start)}deg`);
    stops.push(`rgba(0,0,0,0.1) ${String(grooveEnd)}deg`);
    stops.push(`rgba(255,255,255,0.03) ${String(grooveEnd)}deg`);
    stops.push(`rgba(255,255,255,0.03) ${String(faceEnd - 0.5)}deg`);
    stops.push(`rgba(0,0,0,0.07) ${String(faceEnd)}deg`);
  }

  return `conic-gradient(from 0deg, ${stops.join(", ")})`;
}

const SKIRT_GRADIENT = buildSkirtGradient();

/* Cap concentric rings — visible brushed metal texture */
function buildConcentricsGradient(): string {
  const stops: Array<string> = [];

  for (let ii = 0; ii < 20; ii++) {
    const innerPct = ii * 5;
    const midPct = innerPct + 2;
    const outerPct = innerPct + 5;

    stops.push(`transparent ${String(innerPct)}%`);
    stops.push(`rgba(255,255,255,0.04) ${String(midPct)}%`);
    stops.push(`transparent ${String(outerPct)}%`);
  }

  return `radial-gradient(circle, ${stops.join(", ")})`;
}

const CONCENTRICS = buildConcentricsGradient();

export function RotaryKnob({
  value,
  onChange,
  label,
  bipolar = false,
  formatValue,
  size = "default",
  className,
}: RotaryKnobProps) {
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

  const sizeKey = size ?? "default";
  const bodySize = BODY_PX[sizeKey] ?? 40;
  const totalSize = bodySize + 8;
  const center = totalSize / 2;
  const arcRadius = bodySize / 2 + 2;
  const circumference = 2 * Math.PI * arcRadius;
  const arcLength = circumference * (ARC_DEGREES / 360);
  const remainder = circumference - arcLength;
  const pointerRotation = value * ARC_DEGREES - ARC_START_OFFSET;
  const bodyOffset = (totalSize - bodySize) / 2;

  /* The cap is most of the body — skirt is just a narrow grip edge around the perimeter */
  const capSize = Math.round(bodySize * 0.78);

  const renderUnipolarArc = () => {
    const visibleLength = arcLength * value;

    return (
      <circle
        cx={center}
        cy={center}
        r={arcRadius}
        fill="none"
        stroke="var(--gold-500)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={`${String(visibleLength)} ${String(circumference - visibleLength)}`}
      />
    );
  };

  const renderBipolarArc = () => {
    const halfArc = arcLength / 2;

    if (value >= 0.5) {
      const fillAmount = (value - 0.5) * 2;
      const fillLength = halfArc * fillAmount;

      return (
        <circle
          cx={center}
          cy={center}
          r={arcRadius}
          fill="none"
          stroke="var(--gold-500)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={`${String(fillLength)} ${String(circumference - fillLength)}`}
          strokeDashoffset={-halfArc}
        />
      );
    }

    const fillAmount = (0.5 - value) * 2;
    const fillLength = halfArc * fillAmount;

    return (
      <circle
        cx={center}
        cy={center}
        r={arcRadius}
        fill="none"
        stroke="var(--text-secondary)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={`${String(fillLength)} ${String(circumference - fillLength)}`}
        strokeDashoffset={-(halfArc - fillLength)}
      />
    );
  };

  const displayValue = formatValue ? formatValue(value) : value.toFixed(2);

  /* Static drop shadow — on a non-rotating element so it stays fixed */
  const dropShadow = isDragging
    ? "0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4), 0 0 12px var(--gold-glow)"
    : "0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4)";

  /* Skirt shadow — only inset, since drop shadow is on the static wrapper */
  const skirtShadow = "inset 0 1px 0 rgba(255,255,255,0.05)";

  /* Cap shadow — inset to create the stepped shelf between cap and skirt */
  const capShadow = [
    "0 1px 2px rgba(0,0,0,0.4)",
    "inset 0 2px 3px rgba(255,255,255,0.15)",
    "inset 0 -2px 4px rgba(0,0,0,0.3)",
    "inset 0 0 0 1px rgba(0,0,0,0.2)",
  ].join(", ");

  /* Cap face — flat surface matching the tab color */
  const capBackground = CONCENTRICS + ", var(--surface-3)";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-[4px]",
        knobVariants({ size }),
        className,
      )}
    >
      <div
        className="relative select-none touch-none"
        style={{ width: totalSize, height: totalSize }}
        {...bind()}
      >
        {/* SVG arc */}
        <svg
          width={totalSize}
          height={totalSize}
          className="absolute inset-0"
        >
          <defs>
            <filter id={`glow-${sizeKey}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g
            style={{
              transform: "rotate(135deg)",
              transformOrigin: `${String(center)}px ${String(center)}px`,
            }}
          >
            <circle
              cx={center}
              cy={center}
              r={arcRadius}
              fill="none"
              stroke="var(--border-subtle)"
              strokeWidth={2}
              strokeDasharray={`${String(arcLength)} ${String(remainder)}`}
            />
            <g filter={`url(#glow-${sizeKey})`}>
              {bipolar ? renderBipolarArc() : renderUnipolarArc()}
            </g>
          </g>
        </svg>

        {/* Static shadow ring — doesn't rotate */}
        <div
          className="absolute rounded-full"
          style={{
            width: bodySize,
            height: bodySize,
            left: bodyOffset,
            top: bodyOffset,
            boxShadow: dropShadow,
            transition: "box-shadow 0.15s ease",
            pointerEvents: "none",
          }}
        />

        {/* Entire knob body — rotates as one unit (skirt + cap + tab + pointer) */}
        <div
          className="absolute"
          style={{
            width: bodySize,
            height: bodySize,
            left: bodyOffset,
            top: bodyOffset,
            transform: `rotate(${String(pointerRotation)}deg)`,
          }}
        >
          {/* Ribbed skirt */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `${SKIRT_GRADIENT}, var(--surface-2)`,
              boxShadow: skirtShadow,
            }}
          />

          {/* Tab — bridges cap surface through skirt ribs to edge */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              width: Math.max(8, bodySize * 0.2),
              height: (bodySize - capSize) / 2 + 2,
              top: 1,
              background: "var(--surface-3)",
              borderRadius: "2px 2px 0 0",
              boxShadow: "-1px 0 1px rgba(0,0,0,0.15), 1px 0 1px rgba(0,0,0,0.15)",
            }}
          />

          {/* Cap — smooth inner face */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: capSize,
              height: capSize,
              background: capBackground,
              boxShadow: capShadow,
            }}
          />

          {/* Gold indicator line */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              width: 2.5,
              height: bodySize / 2 - 4,
              top: 3,
              background: "linear-gradient(to bottom, var(--gold-500), var(--gold-300))",
              borderRadius: 2,
              boxShadow: "0 0 4px rgba(196, 153, 60, 0.5)",
            }}
          />

          {/* Center dimple */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: Math.max(3, capSize * 0.1),
              height: Math.max(3, capSize * 0.1),
              background: "var(--surface-1)",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5), 0 0.5px 0 rgba(255,255,255,0.1)",
            }}
          />
        </div>
      </div>

      {label ? (
        <span className="label-caps font-mono text-text-secondary">
          {label}
        </span>
      ) : null}

      <span
        className="rounded-[2px] bg-surface-1 px-[6px] py-[1px] font-mono text-[0.625rem] leading-[0.875rem] text-text-secondary"
        style={{
          fontVariantNumeric: "tabular-nums",
          boxShadow: "var(--shadow-inset-sm)",
        }}
      >
        {displayValue}
      </span>
    </div>
  );
}
