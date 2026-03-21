import { cn } from "@/utils/cn";

const BARS = 4;
const BEATS_PER_BAR = 4;
const SUBDIVISIONS = 4;

interface TimelineRulerProps {
  className?: string;
}

export function TimelineRuler({ className }: TimelineRulerProps) {
  const totalBeats = BARS * BEATS_PER_BAR;
  const totalSubs = totalBeats * SUBDIVISIONS;
  const ticks: Array<{ position: number; height: number; label?: string }> = [];

  for (let sub = 0; sub <= totalSubs; sub++) {
    const position = sub / totalSubs;
    const isBeat = sub % SUBDIVISIONS === 0;
    const isBar = sub % (SUBDIVISIONS * BEATS_PER_BAR) === 0;

    if (isBar) {
      const barNumber = sub / (SUBDIVISIONS * BEATS_PER_BAR) + 1;

      ticks.push({
        position,
        height: 8,
        label: barNumber <= BARS ? String(barNumber) : undefined,
      });
    } else if (isBeat) {
      ticks.push({ position, height: 4 });
    } else {
      ticks.push({ position, height: 2 });
    }
  }

  return (
    <div
      className={cn(
        "relative h-[28px] overflow-hidden bg-surface-1 font-mono text-[0.625rem] leading-[0.875rem] text-text-tertiary",
        className,
      )}
    >
      {ticks.map((tick, index) => (
        <div
          key={`tick-${String(index)}`}
          className="absolute bottom-0"
          style={{
            left: `${String(tick.position * 100)}%`,
          }}
        >
          <div
            className="absolute bottom-0 bg-text-tertiary"
            style={{
              width: 1,
              height: tick.height,
            }}
          />
          {tick.label ? (
            <span
              className="absolute left-[3px] font-mono text-[0.625rem] leading-[0.875rem] text-text-tertiary"
              style={{ bottom: 14 }}
            >
              {tick.label}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
