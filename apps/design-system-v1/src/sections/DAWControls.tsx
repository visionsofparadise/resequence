import { useCallback, useEffect, useRef, useState } from "react";
import DemoSection from "@/components/DemoSection";
import { ChannelStrip } from "@/components/daw/ChannelStrip";
import { GainFader } from "@/components/daw/GainFader";
import { LevelMeter } from "@/components/daw/LevelMeter";
import { RotaryKnob } from "@/components/daw/RotaryKnob";

function useAnimatedSignal(frequency: number): number {
  const [level, setLevel] = useState(0);
  const phaseRef = useRef(Math.random() * Math.PI * 2);

  useEffect(() => {
    let animationId = 0;
    const basePhase = phaseRef.current;

    const animate = (now: number) => {
      const time = now / 1000;
      const sine = Math.sin(time * frequency + basePhase) * 0.5 + 0.5;
      const noise = Math.random() * 0.2;
      const signal = Math.min(1, sine * 0.65 + noise + 0.1);

      setLevel(signal);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [frequency]);

  return level;
}

function formatHz(vv: number): string {
  const hz = vv * 20000;

  if (hz >= 1000) {
    return `${(hz / 1000).toFixed(1)} kHz`;
  }

  return `${String(Math.round(hz))} Hz`;
}

function formatDb(vv: number): string {
  const db = vv * 48 - 48;

  return `${db.toFixed(1)} dB`;
}

function formatPercent(vv: number): string {
  return `${String(Math.round(vv * 100))}%`;
}

function formatPan(vv: number): string {
  if (Math.abs(vv - 0.5) < 0.01) return "C";

  const pct = Math.round(Math.abs(vv - 0.5) * 200);

  return vv < 0.5 ? `L ${String(pct)}` : `R ${String(pct)}`;
}

function KnobsDemo() {
  const [cutoff, setCutoff] = useState(0.65);
  const [panValue, setPanValue] = useState(0.5);
  const [zeroKnob, setZeroKnob] = useState(0);
  const [maxKnob, setMaxKnob] = useState(1);
  const [hzKnob, setHzKnob] = useState(0.12);
  const [dbKnob, setDbKnob] = useState(0.75);
  const [pctKnob, setPctKnob] = useState(0.75);
  const [panKnob, setPanKnob] = useState(0.375);

  const handleCutoff = useCallback((next: number) => {
    setCutoff(next);
  }, []);

  const handlePan = useCallback((next: number) => {
    setPanValue(next);
  }, []);

  const handleZero = useCallback((next: number) => {
    setZeroKnob(next);
  }, []);

  const handleMax = useCallback((next: number) => {
    setMaxKnob(next);
  }, []);

  const handleHz = useCallback((next: number) => {
    setHzKnob(next);
  }, []);

  const handleDb = useCallback((next: number) => {
    setDbKnob(next);
  }, []);

  const handlePct = useCallback((next: number) => {
    setPctKnob(next);
  }, []);

  const handlePanKnob = useCallback((next: number) => {
    setPanKnob(next);
  }, []);

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[16px]">
        <h3 className="text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
          Sizes and Modes
        </h3>
        <div className="flex flex-wrap items-end gap-[24px]">
          <RotaryKnob
            value={cutoff}
            onChange={handleCutoff}
            size="small"
            label="Cutoff"
            formatValue={formatHz}
          />
          <RotaryKnob
            value={cutoff}
            onChange={handleCutoff}
            size="default"
            label="Cutoff"
            formatValue={formatHz}
          />
          <RotaryKnob
            value={cutoff}
            onChange={handleCutoff}
            size="large"
            label="Cutoff"
            formatValue={formatHz}
          />
          <RotaryKnob
            value={panValue}
            onChange={handlePan}
            size="default"
            bipolar
            label="Pan"
            formatValue={formatPan}
          />
          <RotaryKnob
            value={zeroKnob}
            onChange={handleZero}
            size="default"
            label="Min"
          />
          <RotaryKnob
            value={maxKnob}
            onChange={handleMax}
            size="default"
            label="Max"
          />
        </div>
      </div>

      <div className="flex flex-col gap-[16px]">
        <h3 className="text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
          Format Values
        </h3>
        <div className="flex flex-wrap items-end gap-[24px]">
          <RotaryKnob
            value={hzKnob}
            onChange={handleHz}
            size="default"
            label="Freq"
            formatValue={formatHz}
          />
          <RotaryKnob
            value={dbKnob}
            onChange={handleDb}
            size="default"
            label="Gain"
            formatValue={formatDb}
          />
          <RotaryKnob
            value={pctKnob}
            onChange={handlePct}
            size="default"
            label="Mix"
            formatValue={formatPercent}
          />
          <RotaryKnob
            value={panKnob}
            onChange={handlePanKnob}
            size="large"
            bipolar
            label="Pan"
            formatValue={formatPan}
          />
        </div>
      </div>

      <p className="text-[0.625rem] text-text-tertiary">
        Drag vertically to adjust. Hold Shift for fine control. Bipolar mode
        centers at 12 o&apos;clock. Gold glow appears while dragging.
      </p>
    </div>
  );
}

function FadersDemo() {
  const [fader1, setFader1] = useState(0.75);
  const [fader2, setFader2] = useState(0.5);
  const [fader3, setFader3] = useState(0.25);
  const [fader4, setFader4] = useState(1.0);

  const handleFader1 = useCallback((next: number) => {
    setFader1(next);
  }, []);

  const handleFader2 = useCallback((next: number) => {
    setFader2(next);
  }, []);

  const handleFader3 = useCallback((next: number) => {
    setFader3(next);
  }, []);

  const handleFader4 = useCallback((next: number) => {
    setFader4(next);
  }, []);

  return (
    <div className="flex flex-col gap-[16px]">
      <h3 className="text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
        Vertical Gain Faders
      </h3>
      <div className="flex items-end gap-[32px]">
        <div className="flex flex-col items-center gap-[4px]">
          <GainFader value={fader1} onChange={handleFader1} />
          <span className="font-mono text-[0.625rem] text-text-tertiary">0 dB</span>
        </div>
        <div className="flex flex-col items-center gap-[4px]">
          <GainFader value={fader2} onChange={handleFader2} />
          <span className="font-mono text-[0.625rem] text-text-tertiary">-6 dB</span>
        </div>
        <div className="flex flex-col items-center gap-[4px]">
          <GainFader value={fader3} onChange={handleFader3} />
          <span className="font-mono text-[0.625rem] text-text-tertiary">-12 dB</span>
        </div>
        <div className="flex flex-col items-center gap-[4px]">
          <GainFader value={fader4} onChange={handleFader4} height={160} />
          <span className="font-mono text-[0.625rem] text-text-tertiary">Tall</span>
        </div>
      </div>
      <p className="text-[0.625rem] text-text-tertiary">
        Drag thumb to adjust. Hold Shift for fine control. Double-click to reset
        to 0 dB. Click track to jump.
      </p>
    </div>
  );
}

function MetersDemo() {
  const monoLevel = useAnimatedSignal(3);
  const stereoLevel = useAnimatedSignal(2);

  return (
    <div className="flex flex-col gap-[16px]">
      <h3 className="text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
        Level Meters
      </h3>
      <div className="flex items-end gap-[24px]">
        <div className="flex flex-col items-center gap-[4px]">
          <LevelMeter level={monoLevel} height={120} width={8} />
          <span className="font-mono text-[0.625rem] text-text-tertiary">Mono</span>
        </div>
        <div className="flex flex-col items-center gap-[4px]">
          <LevelMeter level={stereoLevel} stereo height={120} width={8} />
          <span className="font-mono text-[0.625rem] text-text-tertiary">Stereo</span>
        </div>
        <div className="flex flex-col items-center gap-[4px]">
          <LevelMeter level={monoLevel} height={80} width={6} />
          <span className="font-mono text-[0.625rem] text-text-tertiary">Small</span>
        </div>
      </div>
      <p className="text-[0.625rem] text-text-tertiary">
        Canvas-rendered segments with peak hold. Green below -12 dB, yellow to
        -3 dB, red above. Click to clear clip indicator.
      </p>
    </div>
  );
}

function ChannelStripsDemo() {
  const channels = ["Kick", "Snare", "Bass", "Keys", "Lead", "Pad"];

  return (
    <div className="flex flex-col gap-[16px]">
      <h3 className="text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
        Channel Strips
      </h3>
      <div className="flex">
        {channels.map((ch, index) => (
          <ChannelStrip key={ch} name={ch} selected={index === 0} />
        ))}
      </div>
      <p className="text-[0.625rem] text-text-tertiary">
        Composite component: name, mute/solo toggles, level meter, gain fader,
        and pan knob. First channel selected.
      </p>
    </div>
  );
}

export default function DAWControls() {
  return (
    <div>
      <DemoSection
        id="knobs"
        title="Rotary Knobs"
        description="Skeuomorphic rotary controls with 270-degree arc. Unipolar and bipolar modes."
      >
        <KnobsDemo />
      </DemoSection>

      <DemoSection
        id="faders"
        title="Gain Faders"
        description="Vertical faders with dB scale, grip texture thumb, and gold fill."
      >
        <FadersDemo />
      </DemoSection>

      <DemoSection
        id="meters"
        title="Level Meters"
        description="Canvas-rendered segmented meters with peak hold and clip indicator."
      >
        <MetersDemo />
      </DemoSection>

      <DemoSection
        id="strips"
        title="Channel Strips"
        description="Composite DAW channel strips with mute, solo, meter, fader, and pan."
      >
        <ChannelStripsDemo />
      </DemoSection>
    </div>
  );
}
