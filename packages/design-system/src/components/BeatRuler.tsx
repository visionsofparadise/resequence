export interface BeatRulerProps {
  totalBars: number;
  beatsPerBar: number;
  pixelsPerBeat: number;
  height?: number;
  className?: string;
}

const BeatRuler = ({ totalBars, beatsPerBar, pixelsPerBeat, height = 24, className }: BeatRulerProps) => {
  const totalBeats = totalBars * beatsPerBar;
  const totalWidth = totalBeats * pixelsPerBeat;
  const ticks: Array<{ x: number; height: number; label?: string }> = [];

  for (let ix = 0; ix <= totalBeats * 2; ix++) {
    const beat = ix / 2;
    const x = beat * pixelsPerBeat;

    if (x > totalWidth) break;

    const isBar = beat % beatsPerBar === 0 && ix % 2 === 0;
    const isBeat = ix % 2 === 0;

    let tickHeight = 6;
    let label: string | undefined;

    if (isBar) {
      tickHeight = 16;
      label = String(beat / beatsPerBar + 1);
    } else if (isBeat) {
      tickHeight = 10;
    }

    ticks.push({ x, height: tickHeight, label });
  }

  return (
    <div className={`relative bg-surface shrink-0${className ? ` ${className}` : ''}`} style={{ width: totalWidth, height }}>
      {ticks.map((tick, ix) => (
        <div key={ix} className="absolute bottom-0" style={{ left: tick.x }}>
          <div className="bg-border" style={{ width: 1, height: tick.height }} />
          {tick.label && (
            <span className="type-label absolute whitespace-nowrap" style={{ left: 4, bottom: 8 }}>
              {tick.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default BeatRuler;
