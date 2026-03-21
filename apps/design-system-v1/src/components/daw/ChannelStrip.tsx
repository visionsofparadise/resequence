import { useCallback, useEffect, useRef, useState } from "react";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { GainFader } from "@/components/daw/GainFader";
import { LevelMeter } from "@/components/daw/LevelMeter";
import { RotaryKnob } from "@/components/daw/RotaryKnob";
import { cn } from "@/utils/cn";

interface ChannelStripProps {
  name: string;
  selected?: boolean;
  className?: string;
}

function useAnimatedSignal(): number {
  const [level, setLevel] = useState(0);
  const phaseRef = useRef(Math.random() * Math.PI * 2);

  useEffect(() => {
    let animationId = 0;
    const basePhase = phaseRef.current;

    const animate = (now: number) => {
      const time = now / 1000;
      const sine = Math.sin(time * 2.5 + basePhase) * 0.5 + 0.5;
      const noise = Math.random() * 0.15;
      const signal = Math.min(1, sine * 0.7 + noise + 0.1);

      setLevel(signal);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return level;
}

export function ChannelStrip({
  name,
  selected = false,
  className,
}: ChannelStripProps) {
  const [muted, setMuted] = useState(false);
  const [soloed, setSoloed] = useState(false);
  const [gain, setGain] = useState(0.75);
  const [pan, setPan] = useState(0.5);

  const meterLevel = useAnimatedSignal();
  const effectiveLevel = muted ? 0 : meterLevel * gain;

  const handleGainChange = useCallback((next: number) => {
    setGain(next);
  }, []);

  const handlePanChange = useCallback((next: number) => {
    setPan(next);
  }, []);

  return (
    <div
      className={cn(
        "flex w-[80px] flex-col items-center gap-[10px] border-x border-border-subtle bg-surface-0 px-[8px] py-[16px]",
        selected && "border-l-2 border-l-gold-500",
        className,
      )}
    >
      <span className="label-caps w-full truncate text-center font-mono text-text-secondary">
        {name}
      </span>

      <div className="flex gap-[2px]">
        <ToggleButton
          ledColor="red"
          pressed={muted}
          onPressedChange={setMuted}
          style={{ padding: "2px 6px", fontSize: "0.5rem" }}
        >
          M
        </ToggleButton>
        <ToggleButton
          ledColor="yellow"
          pressed={soloed}
          onPressedChange={setSoloed}
          style={{ padding: "2px 6px", fontSize: "0.5rem" }}
        >
          S
        </ToggleButton>
      </div>

      <LevelMeter level={effectiveLevel} stereo height={100} width={8} />

      <GainFader value={gain} onChange={handleGainChange} height={140} />

      <RotaryKnob
        value={pan}
        onChange={handlePanChange}
        size="small"
        bipolar
        label="Pan"
        formatValue={(vv) => {
          if (Math.abs(vv - 0.5) < 0.01) return "C";

          const pct = Math.round(Math.abs(vv - 0.5) * 200);

          return vv < 0.5 ? `L${String(pct)}` : `R${String(pct)}`;
        }}
      />
    </div>
  );
}
