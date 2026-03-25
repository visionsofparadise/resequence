import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import TransportBar from './TransportBar';
import {
  Knob,
  Meter,
  Fader,
  ButtonSelection,
  Barcode,
  DotGrid,
  PrimaryIcon,
  BarcodeIcon,
  ConcentricIcon,
  DotCircleIcon,
  DotGridIcon,
  LinesIcon,
  DiagonalIcon,
  CrosshatchIcon,
  CheckerboardIcon,
  CornersIcon,
  RingsIcon,
  QuarterIcon,
  StairsIcon,
} from '@resequence/design-system';
import type { IconProps } from '@resequence/design-system';
import TimelineView from './views/TimelineView';
import PianoRollView from './views/PianoRollView';
import UnitGraphView from './views/UnitGraphView';
import HomeView from './views/HomeView';
import { NAV_HEIGHT, DEFAULT_FONT } from './constants';

const ALL_ICONS: Array<[string, React.ComponentType<IconProps>]> = [
  ['PRIMARY', PrimaryIcon],
  ['BARCODE', BarcodeIcon],
  ['CONCENTRIC', ConcentricIcon],
  ['DOT-CIRCLE', DotCircleIcon],
  ['DOT-GRID', DotGridIcon],
  ['LINES', LinesIcon],
  ['DIAGONAL', DiagonalIcon],
  ['CROSSHATCH', CrosshatchIcon],
  ['CHECKERBOARD', CheckerboardIcon],
  ['CORNERS', CornersIcon],
  ['RINGS', RingsIcon],
  ['QUARTER', QuarterIcon],
  ['STAIRS', StairsIcon],
];

type View = 'home' | 'showcase' | 'timeline' | 'piano-roll' | 'unit-graph';

const viewLabels: Array<{ key: View; label: string }> = [
  { key: 'showcase', label: 'SHOWCASE' },
  { key: 'home', label: 'HOME' },
  { key: 'timeline', label: 'TIMELINE' },
  { key: 'piano-roll', label: 'PIANO ROLL' },
  { key: 'unit-graph', label: 'UNIT GRAPH' },
];

const monochromeTones = [
  { name: "surface", hex: "#1C1A17" },
  { name: "elevated", hex: "#252320" },
  { name: "border", hex: "#3A3632" },
  { name: "dimmed", hex: "#5A5550" },
  { name: "text-secondary", hex: "#7A7570" },
  { name: "text-primary", hex: "#E8E3DB" },
];

const accentColors = [
  { name: "accent-primary", label: "Signal Coral", hex: "#E05A47" },
  { name: "accent-secondary", label: "Slate Teal", hex: "#47A5A5" },
];

const unitColors = [
  { name: "unit-1", label: "Sandstone", hex: "#C98A6C" },
  { name: "unit-2", label: "Acid", hex: "#A8A545" },
  { name: "unit-3", label: "Patina", hex: "#45A8A0" },
  { name: "unit-4", label: "Fuchsia", hex: "#B86894" },
  { name: "unit-5", label: "Periwinkle", hex: "#7B85C4" },
  { name: "unit-6", label: "Sulfur", hex: "#C4B24A" },
];

const ViewNav = ({
  active,
  onSelect,
  lightTheme,
  onToggleTheme,
}: {
  active: View;
  onSelect: (v: View) => void;
  lightTheme: boolean;
  onToggleTheme: () => void;
}) => (
  <div className="flex items-center bg-surface h-8 border-b border-border">
    {viewLabels.map(({ key, label }) => (
      <button
        key={key}
        onClick={() => onSelect(key)}
        className={`type-label transition-colors px-3 cursor-pointer border-none self-stretch ${
          active === key
            ? 'bg-text-primary text-surface'
            : 'bg-transparent text-text-secondary hover:text-text-primary'
        }`}
      >
        {label}
      </button>
    ))}
    <div className="ml-auto">
      <button
        onClick={onToggleTheme}
        className="text-text-secondary hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer p-1"
        aria-label={lightTheme ? 'Switch to dark theme' : 'Switch to light theme'}
      >
        {lightTheme ? <Moon size={14} /> : <Sun size={14} />}
      </button>
    </div>
  </div>
);

const fonts = [
  { name: 'Azeret Mono', family: "'Azeret Mono', monospace" },
  { name: 'Space Mono', family: "'Space Mono', monospace" },
  { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace" },
  { name: 'DM Mono', family: "'DM Mono', monospace" },
  { name: 'Fira Mono', family: "'Fira Mono', monospace" },
  { name: 'Share Tech Mono', family: "'Share Tech Mono', monospace" },
  { name: 'Overpass Mono', family: "'Overpass Mono', monospace" },
];

const Showcase = ({ selectedFont, onSelectFont }: { selectedFont: string; onSelectFont: (f: string) => void }) => {
  const [knobValues, setKnobValues] = useState({ freq: 0.25, resonance: 0.5, gain: 0.75 });
  const [faderValue, setFaderValue] = useState(0.7);
  const [waveform, setWaveform] = useState('SAW');

  return (
    <div className="overflow-auto" style={{ height: `calc(100vh - ${NAV_HEIGHT}px)` }}>
      <div className="border-b border-border px-8 py-5">
        <p className="type-label mb-4 text-accent-primary">TYPEFACE</p>
        <div className="flex flex-wrap gap-1">
          {fonts.map((font) => (
            <button
              key={font.name}
              onClick={() => onSelectFont(font.family)}
              className={`type-label transition-colors px-2 py-1 cursor-pointer border-none ${
                selectedFont === font.family
                  ? 'bg-text-primary text-surface'
                  : 'bg-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {font.name}
            </button>
          ))}
        </div>
      </div>

      {/* Specimen grid */}
      <div className="grid border-b border-border" style={{ gridTemplateColumns: '1fr' }}>
        <div className="grid border-collapse" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          {/* Identity cell — spans 2 cols */}
          <div className="col-span-2 border-r border-b border-border p-8 relative overflow-hidden">
            <p className="type-label mb-3 text-accent-primary">DESIGN SYSTEM</p>
            <h1 className="type-display text-[56px] leading-none">RESEQUENCE</h1>
            <p className="type-display-outline text-[56px] leading-none mt-1">RESEQUENCE</p>
            <p className="type-label mt-4 text-dimmed">AGENT-NATIVE AUDIO PRODUCTION</p>
            <span className="type-label text-dimmed absolute bottom-3 right-4">V0.1.0</span>
          </div>

          {/* Accent colors cell */}
          <div className="border-b border-border p-6 flex flex-col justify-between">
            <p className="type-label mb-4">ACCENTS</p>
            <div className="flex flex-col gap-3">
              {accentColors.map((color) => (
                <div key={color.name} className="flex items-center gap-3">
                  <div style={{ backgroundColor: `var(--color-${color.name})`, width: 32, height: 32 }} />
                  <div>
                    <p className="type-label text-text-primary">{color.label}</p>
                    <p className="type-label">{color.hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monochrome tones — full width */}
          <div className="col-span-3 border-b border-border">
            <div className="flex">
              {monochromeTones.map((tone, ix) => (
                <div
                  key={tone.name}
                  className={`flex-1 flex flex-col justify-end p-3 ${ix < monochromeTones.length - 1 ? 'border-r border-border' : ''}`}
                  style={{ backgroundColor: `var(--color-${tone.name})`, height: 80 }}
                >
                  <span className="type-label" style={{ color: ix < 4 ? 'var(--color-text-primary)' : 'var(--color-surface)' }}>
                    {tone.name}
                  </span>
                  <span className="type-label" style={{ color: ix < 4 ? 'var(--color-text-primary)' : 'var(--color-surface)' }}>
                    {tone.hex}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Unit colors */}
          <div className="col-span-2 border-r border-b border-border p-6">
            <p className="type-label mb-4">UNIT ASSIGNMENT</p>
            <div className="flex gap-2">
              {unitColors.map((color) => (
                <div key={color.name} className="flex flex-col items-center gap-1.5">
                  <div style={{ backgroundColor: `var(--color-${color.name})`, width: 40, height: 40 }} />
                  <p className="type-label text-center text-[8px]">{color.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Typography scale */}
          <div className="border-b border-border p-6">
            <p className="type-label mb-4">TYPE SCALE</p>
            <div className="flex flex-col gap-3">
              <div>
                <p className="type-label mb-1 text-[8px]">DISPLAY</p>
                <p className="type-display text-[18px]">PATTERN</p>
              </div>
              <div>
                <p className="type-label mb-1 text-[8px]">BODY</p>
                <p className="text-[13px]">4 layers</p>
              </div>
              <div>
                <p className="type-label mb-1 text-[8px]">LABEL</p>
                <p className="type-label text-text-primary">OUTPUT</p>
              </div>
              <div>
                <p className="type-label mb-1 text-[8px]">VALUE</p>
                <p className="type-value">127.4.2</p>
              </div>
            </div>
          </div>

          {/* Components row */}
          <div className="border-b border-border p-6">
            <p className="type-label mb-4">KNOBS</p>
            <div className="flex gap-4">
              <Knob value={knobValues.freq} label="FREQ" onChange={(value) => setKnobValues((prev) => ({ ...prev, freq: value }))} />
              <Knob value={knobValues.resonance} label="RES" onChange={(value) => setKnobValues((prev) => ({ ...prev, resonance: value }))} />
              <Knob value={knobValues.gain} label="GAIN" onChange={(value) => setKnobValues((prev) => ({ ...prev, gain: value }))} />
            </div>
          </div>

          <div className="border-b border-r border-border p-6">
            <p className="type-label mb-4">METERS</p>
            <div className="flex gap-3 items-end">
              <Meter level={0.3} animated />
              <Meter level={0.6} animated />
              <Meter level={0.9} animated />
            </div>
          </div>

          <div className="border-b border-border p-6 flex flex-col gap-6">
            <div>
              <p className="type-label mb-3">FADER</p>
              <Fader value={faderValue} label="GAIN" onChange={setFaderValue} />
            </div>
            <div>
              <p className="type-label mb-3">SELECTION</p>
              <ButtonSelection options={["SINE", "SQUARE", "SAW", "TRI"]} active={waveform} onSelect={setWaveform} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid border-b border-border" style={{ gridTemplateColumns: '1fr' }}>
        <div className="px-8 py-5 border-b border-border">
          <p className="type-label text-accent-primary">GRAPHIC ELEMENTS</p>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="border-r border-b border-border p-6 flex flex-col justify-between">
            <p className="type-label mb-4">BARCODE</p>
            <div className="flex flex-col items-center gap-2">
              <Barcode />
              <p className="type-label text-[8px] text-dimmed">RSQ-001</p>
            </div>
          </div>

          <div className="border-r border-b border-border p-6 flex flex-col justify-between">
            <p className="type-label mb-4">DOT GRID</p>
            <div className="flex justify-center">
              <DotGrid />
            </div>
          </div>

          <div className="border-b border-border p-6 flex flex-col justify-between">
            <p className="type-label mb-4">SERIAL STAMP</p>
            <div className="flex flex-col gap-1.5 items-start">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent-primary" />
                <span className="type-label text-text-primary text-[9px]">RSQ-001-2026</span>
              </div>
              <span className="type-label text-[8px] text-dimmed">LOT 0001 &middot; AGENT-NATIVE</span>
              <span className="type-label text-[8px] text-dimmed">48KHZ &middot; 32BIT FLOAT</span>
              <div className="w-full h-px bg-border mt-1 mb-0.5" />
              <span className="type-label" style={{ fontSize: 7, color: 'var(--color-dimmed)' }}>RESEQUENCE DESIGN SYSTEM V0.1.0</span>
            </div>
          </div>

          <div className="col-span-3 border-b border-border p-8 overflow-hidden">
            <p className="type-label mb-5 text-accent-primary">TEXT STAMPS</p>
            <div className="flex gap-8 items-end">
              <div className="flex flex-col gap-1">
                <span className="type-display" style={{ fontSize: 36, lineHeight: 1, color: 'var(--color-text-primary)' }}>RESEQUENCE</span>
                <span className="type-display-outline" style={{ fontSize: 36, lineHeight: 1 }}>RESEQUENCE</span>
              </div>
              <div className="flex flex-col gap-1.5 pb-0.5">
                <span className="type-label text-[11px] text-text-primary" style={{ letterSpacing: '0.2em' }}>AGENT-NATIVE</span>
                <span className="type-label text-[11px] text-accent-secondary" style={{ letterSpacing: '0.2em' }}>TYPESCRIPT</span>
                <span className="type-label text-[11px] text-dimmed" style={{ letterSpacing: '0.2em' }}>V0.1.0</span>
              </div>
              <div style={{ position: 'relative', width: 28, height: 80, flexShrink: 0 }}>
                <span
                  className="type-label"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transformOrigin: 'bottom left',
                    transform: 'rotate(-90deg) translateX(0)',
                    whiteSpace: 'nowrap',
                    fontSize: 10,
                    color: 'var(--color-dimmed)',
                    letterSpacing: '0.15em',
                  }}
                >
                  リシーケンス
                </span>
              </div>
              <div className="flex flex-col gap-1.5 pb-0.5 ml-auto">
                <span className="type-label text-[9px] text-dimmed text-right">128 TRACKS</span>
                <span className="type-label text-[9px] text-dimmed text-right">SAMPLE ACCURATE</span>
                <span className="type-label text-[9px] text-dimmed text-right">COLLABORATIVE</span>
              </div>
            </div>
          </div>

          <div className="col-span-2 border-r border-b border-border p-6">
            <p className="type-label mb-4">GEOMETRIC</p>
            <svg width="280" height="100" viewBox="0 0 280 100" fill="none">
              <rect x="0.5" y="0.5" width="99" height="99" stroke="var(--color-border)" strokeWidth="1" />
              <rect x="12.5" y="12.5" width="75" height="75" stroke="var(--color-dimmed)" strokeWidth="1" />
              <rect x="24" y="24" width="52" height="52" fill="var(--color-accent-primary)" opacity="0.9" />
              <rect x="120.5" y="30.5" width="39" height="39" stroke="var(--color-text-primary)" strokeWidth="1" />
              <rect x="132.5" y="42.5" width="15" height="15" stroke="var(--color-text-primary)" strokeWidth="1" />
              <line x1="120" y1="70" x2="160" y2="70" stroke="var(--color-border)" strokeWidth="1" />
              <line x1="120" y1="80" x2="150" y2="80" stroke="var(--color-border)" strokeWidth="1" />
              <line x1="120" y1="90" x2="155" y2="90" stroke="var(--color-border)" strokeWidth="1" />
              {[0,1,2,3,4,5].map(ix => (
                <rect key={`d${ix}`} x={180 + ix * 10} y={10} width={4} height={4} fill={ix < 3 ? 'var(--color-text-primary)' : 'var(--color-dimmed)'} />
              ))}
              {[0,1,2,3,4,5].map(ix => (
                <rect key={`d2${ix}`} x={180 + ix * 10} y={20} width={4} height={4} fill={ix < 2 ? 'var(--color-text-primary)' : 'var(--color-dimmed)'} />
              ))}
              {[0,1,2,3,4,5].map(ix => (
                <rect key={`d3${ix}`} x={180 + ix * 10} y={30} width={4} height={4} fill={ix < 1 ? 'var(--color-text-primary)' : 'var(--color-dimmed)'} />
              ))}
              {[0,1,2,3,4,5].map(ix => (
                <rect key={`d4${ix}`} x={180 + ix * 10} y={40} width={4} height={4} fill="var(--color-dimmed)" />
              ))}
              <circle cx="200" cy="75" r="16.5" stroke="var(--color-border)" strokeWidth="1" fill="none" />
              <circle cx="200" cy="75" r="4" fill="var(--color-text-primary)" />
              <line x1="250" y1="0" x2="250" y2="100" stroke="var(--color-border)" strokeWidth="1" />
              <line x1="258" y1="0" x2="258" y2="100" stroke="var(--color-border)" strokeWidth="1" />
              <line x1="264" y1="0" x2="264" y2="100" stroke="var(--color-dimmed)" strokeWidth="1" />
              <line x1="272" y1="0" x2="272" y2="100" stroke="var(--color-dimmed)" strokeWidth="0.5" />
            </svg>
          </div>

          <div className="border-b border-border p-6">
            <p className="type-label mb-4">LINE PATTERN</p>
            <div className="flex flex-col gap-1">
              {[
                { w: '100%', o: 1 },
                { w: '80%', o: 0.4 },
                { w: '100%', o: 0.4 },
                { w: '60%', o: 1 },
                { w: '90%', o: 0.4 },
                { w: '100%', o: 1 },
                { w: '70%', o: 0.4 },
                { w: '85%', o: 0.4 },
                { w: '100%', o: 1 },
                { w: '45%', o: 0.4 },
              ].map((line, ix) => (
                <div
                  key={ix}
                  className="bg-text-primary"
                  style={{ width: line.w, height: 1, opacity: line.o }}
                />
              ))}
            </div>
          </div>

          <div className="col-span-3 border-b border-border p-8">
            <p className="type-label mb-5 text-accent-primary">PROJECT ICONS</p>
            <div className="flex gap-6 flex-wrap">
              {ALL_ICONS.map(([name, Icon]) => (
                <div key={name} className="flex flex-col items-center gap-2">
                  <Icon color="var(--color-accent-primary)" size={48} />
                  <span className="type-label text-[8px] text-dimmed">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [view, setView] = useState<View>('home');
  const [lightTheme, setLightTheme] = useState(false);
  const [selectedFont, setSelectedFont] = useState(DEFAULT_FONT);

  const toggleTheme = () => {
    setLightTheme((prev) => {
      const next = !prev;

      if (next) {
        document.documentElement.classList.add('theme-light');
      } else {
        document.documentElement.classList.remove('theme-light');
      }

      return next;
    });
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: selectedFont }}>
      <div className="fixed top-0 left-0 right-0 z-40">
        <ViewNav active={view} onSelect={setView} lightTheme={lightTheme} onToggleTheme={toggleTheme} />
      </div>

      <div style={{ paddingTop: NAV_HEIGHT }}>
        {view === 'home' && <HomeView />}
        {view === 'showcase' && <Showcase selectedFont={selectedFont} onSelectFont={setSelectedFont} />}
        {view === 'timeline' && <TimelineView />}
        {view === 'piano-roll' && <PianoRollView />}
        {view === 'unit-graph' && <UnitGraphView />}
      </div>

      {view !== 'home' && view !== 'showcase' && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <TransportBar />
        </div>
      )}
    </div>
  );
};

export default App;
