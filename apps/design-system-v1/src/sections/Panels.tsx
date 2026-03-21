import { useCallback, useState } from "react";
import DemoSection from "@/components/DemoSection";
import { MixerConsole } from "@/components/panels/MixerConsole";
import { PropertyList } from "@/components/panels/PropertyList";

function PropertyListDemo() {
  const [oscType, setOscType] = useState("saw");
  const [cutoff, setCutoff] = useState(0.65);
  const [resonance, setResonance] = useState(0.3);
  const [attack, setAttack] = useState("10");
  const [decay, setDecay] = useState("200");
  const [sustain, setSustain] = useState(0.7);
  const [release, setRelease] = useState("500");
  const [bypass, setBypass] = useState(false);

  const handleOscType = useCallback((next: string) => {
    setOscType(next);
  }, []);

  const handleCutoff = useCallback((next: number) => {
    setCutoff(next);
  }, []);

  const handleResonance = useCallback((next: number) => {
    setResonance(next);
  }, []);

  const handleAttack = useCallback((next: string) => {
    setAttack(next);
  }, []);

  const handleDecay = useCallback((next: string) => {
    setDecay(next);
  }, []);

  const handleSustain = useCallback((next: number) => {
    setSustain(next);
  }, []);

  const handleRelease = useCallback((next: string) => {
    setRelease(next);
  }, []);

  const handleBypass = useCallback((next: boolean) => {
    setBypass(next);
  }, []);

  return (
    <PropertyList
      className="max-w-[320px]"
      groups={[
        {
          label: "Synth Parameters",
          items: [
            {
              label: "Osc Type",
              type: "select",
              value: oscType,
              onChange: handleOscType,
              options: [
                { label: "Sine", value: "sine" },
                { label: "Saw", value: "saw" },
                { label: "Square", value: "square" },
                { label: "Triangle", value: "tri" },
              ],
            },
            {
              label: "Cutoff",
              type: "knob",
              value: cutoff,
              onChange: handleCutoff,
            },
            {
              label: "Resonance",
              type: "knob",
              value: resonance,
              onChange: handleResonance,
            },
            {
              label: "Attack",
              type: "input",
              value: attack,
              onChange: handleAttack,
            },
            {
              label: "Decay",
              type: "input",
              value: decay,
              onChange: handleDecay,
            },
            {
              label: "Sustain",
              type: "knob",
              value: sustain,
              onChange: handleSustain,
            },
            {
              label: "Release",
              type: "input",
              value: release,
              onChange: handleRelease,
            },
            {
              label: "Bypass",
              type: "toggle",
              pressed: bypass,
              onPressedChange: handleBypass,
            },
          ],
        },
      ]}
    />
  );
}

export default function Panels() {
  return (
    <div>
      <DemoSection
        id="properties"
        title="Property List"
        description="Collapsible parameter groups with inline controls. Alternating row backgrounds."
      >
        <PropertyListDemo />
      </DemoSection>

      <DemoSection
        id="mixer"
        title="Mixer Console"
        description="Horizontal scrolling mixer with channel strips and a separated master bus."
      >
        <MixerConsole />
      </DemoSection>
    </div>
  );
}
