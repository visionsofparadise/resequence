import { ChannelStrip } from "@/components/daw/ChannelStrip";
import { cn } from "@/utils/cn";

const CHANNEL_NAMES = ["Kick", "Snare", "HiHat", "Bass", "Keys", "Lead", "Pad", "Vox"];

interface MixerConsoleProps {
  className?: string;
}

export function MixerConsole({ className }: MixerConsoleProps) {
  return (
    <div
      className={cn(
        "rounded-[4px] border border-border-default bg-surface-2",
        className,
      )}
    >
      <div className="px-[12px] py-[8px]">
        <span className="font-display text-[1rem] leading-[1.375rem] text-text-secondary">
          MIXER
        </span>
      </div>
      <div className="flex gap-[2px] overflow-x-auto pb-[8px]">
        {CHANNEL_NAMES.map((name, index) => (
          <ChannelStrip key={name} name={name} selected={index === 0} />
        ))}
        <div className="border-l-2 border-border-strong">
          <ChannelStrip name="Master" className="w-[88px]" />
        </div>
      </div>
    </div>
  );
}
