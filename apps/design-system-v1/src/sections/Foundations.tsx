import DemoSection from "@/components/DemoSection";

interface ColorSwatch {
  token: string;
  label: string;
  cssVar: string;
  lightHex: string;
  darkHex: string;
}

const SURFACE_SWATCHES: Array<ColorSwatch> = [
  { token: "--surface-0", label: "Surface 0", cssVar: "var(--surface-0)", lightHex: "#faf8f5", darkHex: "#0f0e0c" },
  { token: "--surface-1", label: "Surface 1", cssVar: "var(--surface-1)", lightHex: "#f2efe9", darkHex: "#1a1816" },
  { token: "--surface-2", label: "Surface 2", cssVar: "var(--surface-2)", lightHex: "#e8e4dc", darkHex: "#242220" },
  { token: "--surface-3", label: "Surface 3", cssVar: "var(--surface-3)", lightHex: "#ddd8ce", darkHex: "#2e2c29" },
  { token: "--surface-4", label: "Surface 4", cssVar: "var(--surface-4)", lightHex: "#d0cac0", darkHex: "#3a3733" },
];

const BORDER_SWATCHES: Array<ColorSwatch> = [
  { token: "--border-subtle", label: "Subtle", cssVar: "var(--border-subtle)", lightHex: "#d0cac0", darkHex: "#3a3733" },
  { token: "--border-default", label: "Default", cssVar: "var(--border-default)", lightHex: "#b8b0a4", darkHex: "#4a4640" },
  { token: "--border-strong", label: "Strong", cssVar: "var(--border-strong)", lightHex: "#9a9084", darkHex: "#5e594f" },
];

const TEXT_SWATCHES: Array<ColorSwatch> = [
  { token: "--text-primary", label: "Primary", cssVar: "var(--text-primary)", lightHex: "#1a1816", darkHex: "#e8e0d4" },
  { token: "--text-secondary", label: "Secondary", cssVar: "var(--text-secondary)", lightHex: "#5e594f", darkHex: "#a89e90" },
  { token: "--text-tertiary", label: "Tertiary", cssVar: "var(--text-tertiary)", lightHex: "#8a8070", darkHex: "#706858" },
];

const GOLD_SWATCHES: Array<ColorSwatch> = [
  { token: "--gold-300", label: "Gold 300", cssVar: "var(--gold-300)", lightHex: "#e0c070", darkHex: "#e0c070" },
  { token: "--gold-400", label: "Gold 400", cssVar: "var(--gold-400)", lightHex: "#d4ab52", darkHex: "#d4ab52" },
  { token: "--gold-500", label: "Gold 500", cssVar: "var(--gold-500)", lightHex: "#c4993c", darkHex: "#c4993c" },
  { token: "--gold-600", label: "Gold 600", cssVar: "var(--gold-600)", lightHex: "#a67e2e", darkHex: "#a67e2e" },
  { token: "--gold-900", label: "Gold 900", cssVar: "var(--gold-900)", lightHex: "#2a2010", darkHex: "#2a2010" },
];

const SEMANTIC_SWATCHES: Array<ColorSwatch> = [
  { token: "--meter-green", label: "Meter Green", cssVar: "var(--meter-green)", lightHex: "#5a9a3e", darkHex: "#5a9a3e" },
  { token: "--meter-yellow", label: "Meter Yellow", cssVar: "var(--meter-yellow)", lightHex: "#c4993c", darkHex: "#c4993c" },
  { token: "--meter-red", label: "Meter Red", cssVar: "var(--meter-red)", lightHex: "#c44040", darkHex: "#c44040" },
  { token: "--solo-yellow", label: "Solo", cssVar: "var(--solo-yellow)", lightHex: "#c4993c", darkHex: "#c4993c" },
  { token: "--mute-red", label: "Mute", cssVar: "var(--mute-red)", lightHex: "#c44040", darkHex: "#c44040" },
  { token: "--record-red", label: "Record", cssVar: "var(--record-red)", lightHex: "#dd4444", darkHex: "#dd4444" },
];

function SwatchGroup({ title, swatches }: { title: string; swatches: Array<ColorSwatch> }) {
  return (
    <div className="mb-[16px]">
      <h3 className="mb-[8px] text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
        {title}
      </h3>
      <div className="flex flex-wrap gap-[12px]">
        {swatches.map((swatch) => (
          <div key={swatch.token} className="flex flex-col items-center gap-[4px]">
            <div
              className="h-[48px] w-[48px] rounded-[4px] border border-border-subtle"
              style={{ backgroundColor: swatch.cssVar }}
            />
            <span className="text-[0.625rem] leading-[0.875rem] text-text-secondary">
              {swatch.label}
            </span>
            <span className="text-[0.625rem] leading-[0.875rem] text-text-tertiary">
              {swatch.token}
            </span>
            {swatch.lightHex === swatch.darkHex ? (
              <span className="text-[0.625rem] leading-[0.875rem] text-text-tertiary">
                {swatch.lightHex}
              </span>
            ) : (
              <span className="text-[0.625rem] leading-[0.875rem] text-text-tertiary">
                L {swatch.lightHex} / D {swatch.darkHex}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface TypographyRow {
  token: string;
  size: string;
  lineHeight: string;
  weight: number;
  label: string;
  sample: string;
  fontFamily: string;
}

const TYPE_SCALE: Array<TypographyRow> = [
  { token: "--text-xxs", size: "0.625rem", lineHeight: "0.875rem", weight: 400, label: "XXS", sample: "-12.0 dB", fontFamily: "var(--font-mono)" },
  { token: "--text-xs", size: "0.6875rem", lineHeight: "1rem", weight: 400, label: "XS", sample: "Low-Pass Filter", fontFamily: "var(--font-mono)" },
  { token: "--text-sm", size: "0.75rem", lineHeight: "1.125rem", weight: 400, label: "SM", sample: "Master Output", fontFamily: "var(--font-mono)" },
  { token: "--text-base", size: "0.8125rem", lineHeight: "1.125rem", weight: 500, label: "Base", sample: "Wet/Dry Mix", fontFamily: "var(--font-mono)" },
  { token: "--text-lg", size: "1rem", lineHeight: "1.375rem", weight: 500, label: "LG", sample: "Channel Strip", fontFamily: "var(--font-mono)" },
  { token: "--text-xl", size: "1.25rem", lineHeight: "1.75rem", weight: 400, label: "XL", sample: "Synthesizer", fontFamily: "var(--font-display)" },
  { token: "--text-2xl", size: "1.75rem", lineHeight: "2.25rem", weight: 400, label: "2XL", sample: "Resequence", fontFamily: "var(--font-display)" },
];

interface ShadowDemo {
  label: string;
  cssVar: string;
}

const ELEVATION_SHADOWS: Array<ShadowDemo> = [
  { label: "shadow-sm", cssVar: "var(--shadow-sm)" },
  { label: "shadow-md", cssVar: "var(--shadow-md)" },
  { label: "shadow-lg", cssVar: "var(--shadow-lg)" },
  { label: "shadow-xl", cssVar: "var(--shadow-xl)" },
];

const INSET_SHADOWS: Array<ShadowDemo> = [
  { label: "inset-sm", cssVar: "var(--shadow-inset-sm)" },
  { label: "inset-md", cssVar: "var(--shadow-inset-md)" },
  { label: "inset-lg", cssVar: "var(--shadow-inset-lg)" },
];

interface SpacingToken {
  label: string;
  value: string;
  pixels: number;
}

const SPACING_TOKENS: Array<SpacingToken> = [
  { label: "--space-0.5", value: "var(--space-0-5)", pixels: 2 },
  { label: "--space-1", value: "var(--space-1)", pixels: 4 },
  { label: "--space-2", value: "var(--space-2)", pixels: 8 },
  { label: "--space-3", value: "var(--space-3)", pixels: 12 },
  { label: "--space-4", value: "var(--space-4)", pixels: 16 },
  { label: "--space-6", value: "var(--space-6)", pixels: 24 },
  { label: "--space-8", value: "var(--space-8)", pixels: 32 },
];

function ColorsSection() {
  return (
    <DemoSection
      id="colors"
      title="Colors"
      description="Warm gray scale with subtle amber undertones. Gold as the sole accent color."
    >
      <SwatchGroup title="Surface" swatches={SURFACE_SWATCHES} />
      <SwatchGroup title="Border" swatches={BORDER_SWATCHES} />
      <SwatchGroup title="Text" swatches={TEXT_SWATCHES} />
      <SwatchGroup title="Gold Accent" swatches={GOLD_SWATCHES} />
      <SwatchGroup title="Semantic" swatches={SEMANTIC_SWATCHES} />
    </DemoSection>
  );
}

function TypographySection() {
  return (
    <DemoSection
      id="typography"
      title="Typography"
      description="Switchable display + mono font pairings. Labels use uppercase small caps with letter spacing."
    >
      <div className="flex flex-col gap-[16px]">
        {TYPE_SCALE.map((row) => (
          <div key={row.token} className="flex items-baseline gap-[16px]">
            <span className="w-[48px] shrink-0 text-[0.625rem] leading-[0.875rem] text-text-tertiary">
              {row.label}
            </span>
            <span className="w-[48px] shrink-0 text-[0.625rem] leading-[0.875rem] text-text-tertiary">
              {row.size}
            </span>
            <span
              style={{
                fontFamily: row.fontFamily,
                fontSize: row.size,
                lineHeight: row.lineHeight,
                fontWeight: row.weight,
              }}
            >
              {row.sample}
            </span>
          </div>
        ))}

        <div className="mt-[8px] border-t border-border-subtle pt-[12px]">
          <h3 className="mb-[8px] text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
            Tabular Numerals
          </h3>
          <div
            className="flex flex-col items-start gap-[2px] font-mono text-[0.8125rem] leading-[1.125rem]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            <span>120.5 BPM</span>
            <span>&nbsp;&nbsp;3.2 dB</span>
            <span>&nbsp;44100 Hz</span>
            <span>&nbsp;&nbsp;0.0 ms</span>
          </div>
        </div>
      </div>
    </DemoSection>
  );
}

function ShadowsSection() {
  return (
    <DemoSection
      id="shadows"
      title="Shadows"
      description="Shadow-only depth. No gradients on surfaces. Flat matte surfaces differentiated by shadow weight."
    >
      <div className="mb-[16px]">
        <h3 className="mb-[8px] text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
          Elevation
        </h3>
        <div className="flex flex-wrap gap-[16px]">
          {ELEVATION_SHADOWS.map((shadow) => (
            <div key={shadow.label} className="flex flex-col items-center gap-[8px]">
              <div
                className="h-[64px] w-[80px] rounded-[4px] bg-surface-3"
                style={{ boxShadow: shadow.cssVar }}
              />
              <span className="text-[0.625rem] leading-[0.875rem] text-text-tertiary">
                {shadow.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-[16px]">
        <h3 className="mb-[8px] text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
          Inset
        </h3>
        <div className="flex flex-wrap gap-[16px]">
          {INSET_SHADOWS.map((shadow) => (
            <div key={shadow.label} className="flex flex-col items-center gap-[8px]">
              <div
                className="h-[64px] w-[80px] rounded-[4px] bg-surface-3"
                style={{ boxShadow: shadow.cssVar }}
              />
              <span className="text-[0.625rem] leading-[0.875rem] text-text-tertiary">
                {shadow.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-[8px] text-[0.75rem] leading-[1.125rem] font-medium text-text-secondary">
          Edge Highlight
        </h3>
        <div className="flex flex-wrap gap-[16px]">
          <div className="flex flex-col items-center gap-[8px]">
            <div
              className="h-[64px] w-[80px] rounded-[4px] bg-surface-3"
              style={{
                boxShadow: "var(--shadow-md)",
                borderTop: "1px solid rgba(255,255,255,0.03)",
                borderLeft: "1px solid rgba(255,255,255,0.03)",
              }}
            />
            <span className="text-[0.625rem] leading-[0.875rem] text-text-tertiary">
              0.03 opacity
            </span>
          </div>
          <div className="flex flex-col items-center gap-[8px]">
            <div
              className="h-[64px] w-[80px] rounded-[4px] bg-surface-3"
              style={{
                boxShadow: "var(--shadow-md)",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                borderLeft: "1px solid rgba(255,255,255,0.06)",
              }}
            />
            <span className="text-[0.625rem] leading-[0.875rem] text-text-tertiary">
              0.06 opacity
            </span>
          </div>
        </div>
      </div>
    </DemoSection>
  );
}

function SpacingSection() {
  return (
    <DemoSection
      id="spacing"
      title="Spacing"
      description="4px base grid. All spacing is multiples of 4. Compact by default."
    >
      <div className="flex flex-col gap-[8px]">
        {SPACING_TOKENS.map((token) => (
          <div key={token.label} className="flex items-center gap-[12px]">
            <span className="w-[80px] shrink-0 text-[0.625rem] leading-[0.875rem] text-text-tertiary">
              {token.label}
            </span>
            <div
              className="h-[8px] rounded-[2px] bg-gold-500"
              style={{ width: `${String(token.pixels)}px` }}
            />
            <span className="text-[0.625rem] leading-[0.875rem] text-text-secondary">
              {token.pixels}px
            </span>
          </div>
        ))}
      </div>
    </DemoSection>
  );
}

export default function Foundations() {
  return (
    <div>
      <ColorsSection />
      <TypographySection />
      <ShadowsSection />
      <SpacingSection />
    </div>
  );
}
