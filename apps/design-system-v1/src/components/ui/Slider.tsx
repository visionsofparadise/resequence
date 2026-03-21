import { Range, Root, Thumb, Track } from "@radix-ui/react-slider";
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "@/utils/cn";

type SliderProps = ComponentPropsWithoutRef<typeof Root>;

const tickPositions = [0, 25, 50, 75, 100];

const Slider = forwardRef<HTMLSpanElement, SliderProps>(
  ({ className, ...props }, ref) => (
    <Root
      ref={ref}
      className={cn(
        "group relative flex w-full touch-none items-center select-none",
        className,
      )}
      {...props}
    >
      <Track
        className="relative h-[6px] w-full grow rounded-full bg-surface-4"
        style={{ boxShadow: "var(--shadow-inset-sm)" }}
      >
        <Range className="absolute h-full rounded-full bg-gold-500 transition-shadow group-active:[box-shadow:0_0_6px_var(--gold-glow)]" />
        {/* Center notch at 50% */}
        <span
          className="pointer-events-none absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-border-subtle opacity-40"
          aria-hidden="true"
        />
      </Track>
      <Thumb
        className={cn(
          "block h-[22px] w-[14px] rounded-[2px] border border-border-strong bg-surface-3 focus-visible:outline-none",
          "focus-visible:[box-shadow:var(--shadow-md),0_0_8px_var(--gold-glow)]",
          "group-active:border-gold-500",
        )}
        style={{
          boxShadow: "var(--shadow-md)",
          borderTop: "1px solid var(--surface-4)",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, var(--border-subtle) 2px, var(--border-subtle) 3px)",
          backgroundPosition: "center",
          backgroundSize: "10px 13px",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Tick marks below the track */}
      <span className="pointer-events-none absolute top-full mt-[2px] flex w-full justify-between px-[7px]" aria-hidden="true">
        {tickPositions.map((pos) => (
          <span
            key={pos}
            className="h-[4px] w-px bg-border-subtle"
          />
        ))}
      </span>
    </Root>
  ),
);

Slider.displayName = "Slider";

export { Slider };
export type { SliderProps };
