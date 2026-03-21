import { useState } from "react";
import DemoSection from "@/components/DemoSection";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ToggleButton } from "@/components/ui/ToggleButton";

function ButtonsDemo() {
  return (
    <div className="flex flex-col gap-[16px]">
      <div>
        <h3 className="mb-[8px] text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
          Variants
        </h3>
        <div className="flex flex-wrap items-center gap-[8px]">
          <Button>Default</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </div>
      <div>
        <h3 className="mb-[8px] text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
          Sizes
        </h3>
        <div className="flex flex-wrap items-center gap-[8px]">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </div>
      <div>
        <h3 className="mb-[8px] text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
          States
        </h3>
        <div className="flex flex-wrap items-center gap-[8px]">
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
          <span className="text-[0.625rem] text-text-tertiary">
            Press and hold to see active state
          </span>
        </div>
      </div>
    </div>
  );
}

function TogglesDemo() {
  const [muteOn, setMuteOn] = useState(false);
  const [soloOn, setSoloOn] = useState(false);
  const [recOn, setRecOn] = useState(false);
  const [bypassOn, setBypassOn] = useState(false);

  return (
    <div className="flex flex-col gap-[12px]">
      <h3 className="text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
        LED Toggle Buttons
      </h3>
      <div className="flex flex-wrap items-center gap-[8px]">
        <ToggleButton
          ledColor="red"
          pressed={muteOn}
          onPressedChange={setMuteOn}
        >
          MUTE
        </ToggleButton>
        <ToggleButton
          ledColor="yellow"
          pressed={soloOn}
          onPressedChange={setSoloOn}
        >
          SOLO
        </ToggleButton>
        <ToggleButton
          ledColor="red"
          pressed={recOn}
          onPressedChange={setRecOn}
        >
          REC
        </ToggleButton>
        <ToggleButton
          ledColor="gold"
          pressed={bypassOn}
          onPressedChange={setBypassOn}
        >
          BYPASS
        </ToggleButton>
      </div>
      <p className="text-[0.625rem] text-text-tertiary">
        Click to toggle. The LED indicator lights up when active.
      </p>
    </div>
  );
}

function SlidersDemo() {
  const [midiValue, setMidiValue] = useState([64]);
  const [volumeValue, setVolumeValue] = useState([-6]);
  const [compactValue, setCompactValue] = useState([50]);

  return (
    <div className="flex flex-col gap-[16px]">
      <div>
        <h3 className="mb-[8px] text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
          Compact (120px)
        </h3>
        <div className="flex items-center gap-[12px]">
          <Slider
            className="w-[120px]"
            min={0}
            max={100}
            step={1}
            value={compactValue}
            onValueChange={setCompactValue}
          />
          <span
            className="w-[32px] shrink-0 text-right font-mono text-[0.75rem] text-text-primary"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {compactValue[0]}%
          </span>
        </div>
      </div>

      <div>
        <h3 className="mb-[8px] text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
          Default (full-width, MIDI CC)
        </h3>
        <div className="flex items-center gap-[12px]">
          <Slider
            min={0}
            max={127}
            step={1}
            value={midiValue}
            onValueChange={setMidiValue}
          />
          <span
            className="w-[40px] shrink-0 text-right font-mono text-[0.75rem] text-text-primary"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {midiValue[0]}
          </span>
        </div>
      </div>

      <div>
        <h3 className="mb-[8px] text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
          Volume (labeled, wide)
        </h3>
        <div className="flex max-w-[400px] items-center gap-[12px]">
          <span className="shrink-0 font-mono text-[0.6875rem] text-text-secondary">
            Volume
          </span>
          <span className="shrink-0 font-mono text-[0.625rem] text-text-tertiary">
            -60 dB
          </span>
          <Slider
            min={-60}
            max={6}
            step={0.5}
            value={volumeValue}
            onValueChange={setVolumeValue}
          />
          <span className="shrink-0 font-mono text-[0.625rem] text-text-tertiary">
            +6 dB
          </span>
          <span
            className="w-[52px] shrink-0 text-right font-mono text-[0.75rem] text-text-primary"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {(volumeValue[0] ?? 0) > 0 ? "+" : ""}{volumeValue[0] ?? 0} dB
          </span>
        </div>
      </div>

      <p className="text-[0.625rem] text-text-tertiary">
        Metallic thumb with grip lines. Gold glow on focus and drag. Tick marks at 0/25/50/75/100%.
      </p>
    </div>
  );
}

function InputsDemo() {
  return (
    <div className="flex flex-col gap-[12px]">
      <h3 className="text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
        Text Inputs
      </h3>
      <div className="flex flex-wrap items-center gap-[8px]">
        <Input placeholder="Filter Cutoff Hz..." className="w-[180px]" />
        <Input type="number" defaultValue={440} className="w-[100px]" />
      </div>
      <p className="text-[0.625rem] text-text-tertiary">
        Recessed field with gold focus ring. DM Mono text.
      </p>
    </div>
  );
}

function SelectsDemo() {
  return (
    <div className="flex flex-col gap-[12px]">
      <h3 className="text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
        Select Dropdown
      </h3>
      <Select defaultValue="sine">
        <SelectTrigger className="w-[180px]">Waveform</SelectTrigger>
        <SelectContent>
          <SelectItem value="sine">Sine</SelectItem>
          <SelectItem value="saw">Saw</SelectItem>
          <SelectItem value="square">Square</SelectItem>
          <SelectItem value="triangle">Triangle</SelectItem>
          <SelectItem value="noise">Noise</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-[0.625rem] text-text-tertiary">
        Recessed trigger with Chevron. Gold highlight on focused item.
      </p>
    </div>
  );
}

function DialogDemo() {
  return (
    <div className="flex flex-col gap-[12px]">
      <h3 className="text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
        Dialog
      </h3>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Export Settings</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Export Settings</DialogTitle>
          <DialogDescription>
            Configure the output format for your audio render.
          </DialogDescription>
          <div className="mt-[16px] flex flex-col gap-[12px]">
            <div className="flex items-center gap-[8px]">
              <span className="w-[80px] text-[0.75rem] text-text-secondary">Format</span>
              <Select defaultValue="wav">
                <SelectTrigger className="w-[140px]">Format</SelectTrigger>
                <SelectContent>
                  <SelectItem value="wav">WAV 24-bit</SelectItem>
                  <SelectItem value="aiff">AIFF 24-bit</SelectItem>
                  <SelectItem value="flac">FLAC</SelectItem>
                  <SelectItem value="mp3">MP3 320kbps</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-[8px]">
              <span className="w-[80px] text-[0.75rem] text-text-secondary">
                Sample Rate
              </span>
              <Input defaultValue={48000} type="number" className="w-[140px]" />
            </div>
            <div className="mt-[8px] flex justify-end gap-[8px]">
              <Button variant="ghost">Cancel</Button>
              <Button>Export</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PopoverDemo() {
  return (
    <div className="flex flex-col gap-[12px]">
      <h3 className="text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
        Popover
      </h3>
      <Popover>
        <PopoverTrigger asChild>
          <Button>Edit Parameters</Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-col gap-[8px]">
            <h4 className="font-display text-[1rem] leading-[1.375rem] text-text-primary">
              LFO Settings
            </h4>
            <div className="flex items-center gap-[8px]">
              <span className="w-[60px] text-[0.6875rem] text-text-secondary">Rate</span>
              <Input defaultValue="2.5" className="w-[80px]" />
              <span className="text-[0.6875rem] text-text-tertiary">Hz</span>
            </div>
            <div className="flex items-center gap-[8px]">
              <span className="w-[60px] text-[0.6875rem] text-text-secondary">Depth</span>
              <Input defaultValue="75" className="w-[80px]" />
              <span className="text-[0.6875rem] text-text-tertiary">%</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function TabsDemo() {
  return (
    <div className="flex flex-col gap-[12px]">
      <h3 className="text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
        Tabs
      </h3>
      <Tabs defaultValue="oscillator">
        <TabsList>
          <TabsTrigger value="oscillator">Oscillator</TabsTrigger>
          <TabsTrigger value="filter">Filter</TabsTrigger>
          <TabsTrigger value="envelope">Envelope</TabsTrigger>
        </TabsList>
        <TabsContent value="oscillator">
          <div className="flex flex-col gap-[4px] text-[0.75rem] text-text-secondary">
            <span>Waveform: Sawtooth</span>
            <span>Octave: 0</span>
            <span>Detune: +3 cents</span>
            <span>Unison Voices: 4</span>
          </div>
        </TabsContent>
        <TabsContent value="filter">
          <div className="flex flex-col gap-[4px] text-[0.75rem] text-text-secondary">
            <span>Type: Low-Pass 24dB</span>
            <span>Cutoff: 1200 Hz</span>
            <span>Resonance: 35%</span>
            <span>Key Tracking: 50%</span>
          </div>
        </TabsContent>
        <TabsContent value="envelope">
          <div className="flex flex-col gap-[4px] text-[0.75rem] text-text-secondary">
            <span>Attack: 5 ms</span>
            <span>Decay: 120 ms</span>
            <span>Sustain: 70%</span>
            <span>Release: 250 ms</span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Controls() {
  return (
    <div>
      <DemoSection
        id="buttons"
        title="Buttons"
        description="Flat matte surfaces with shadow elevation. Physically depress on active state."
      >
        <ButtonsDemo />
      </DemoSection>

      <DemoSection
        id="toggles"
        title="Toggles"
        description="Hardware-style LED toggle buttons. Small indicator light shows on/off state."
      >
        <TogglesDemo />
      </DemoSection>

      <DemoSection
        id="sliders"
        title="Sliders"
        description="Recessed track with gold fill, center notch, and tick marks. Metallic thumb with grip texture and gold glow on focus/drag."
      >
        <SlidersDemo />
      </DemoSection>

      <DemoSection
        id="inputs"
        title="Inputs"
        description="Recessed input fields with gold focus state. DM Mono for all text."
      >
        <InputsDemo />
      </DemoSection>

      <DemoSection
        id="selects"
        title="Selects"
        description="Dropdown select with recessed trigger and elevated popover."
      >
        <SelectsDemo />
      </DemoSection>

      <DemoSection
        id="dialogs"
        title="Dialogs"
        description="Modal overlay with blur. Syne titles. Edge highlight on content panel."
      >
        <DialogDemo />
      </DemoSection>

      <DemoSection
        id="popovers"
        title="Popovers"
        description="Floating panels for inline parameter editing."
      >
        <PopoverDemo />
      </DemoSection>

      <DemoSection
        id="tabs"
        title="Tabs"
        description="Underline-style tabs with gold active indicator."
      >
        <TabsDemo />
      </DemoSection>
    </div>
  );
}
