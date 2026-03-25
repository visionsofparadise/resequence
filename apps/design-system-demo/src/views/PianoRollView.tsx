import { useEffect, useRef } from 'react';
import { BeatRuler } from '@resequence/design-system';
import PianoKeys from '../PianoKeys';
import ViewHeader from '../ViewHeader';
import { TOTAL_BARS, BEATS_PER_BAR, PIXELS_PER_BEAT } from '../demo-data';
import { CHROME_HEIGHT } from '../constants';

const KEY_HEIGHT = 10;
const PIANO_WIDTH = 48;
const RULER_HEIGHT = 24;
const TOTAL_KEYS = 120;
const GRID_HEIGHT = TOTAL_KEYS * KEY_HEIGHT;

const totalBeats = TOTAL_BARS * BEATS_PER_BAR;
const gridWidth = totalBeats * PIXELS_PER_BEAT;

const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);
const MAX_PITCH = TOTAL_KEYS - 1;

const hardcodedNotes = [
  { beat: 0, pitch: 48, duration: 4, velocity: 90 },
  { beat: 0, pitch: 60, duration: 2, velocity: 80 },
  { beat: 0, pitch: 63, duration: 2, velocity: 75 },
  { beat: 0, pitch: 67, duration: 2, velocity: 70 },
  { beat: 2, pitch: 60, duration: 1, velocity: 85 },
  { beat: 3, pitch: 63, duration: 1, velocity: 82 },
  { beat: 4, pitch: 48, duration: 4, velocity: 88 },
  { beat: 4, pitch: 60, duration: 2, velocity: 78 },
  { beat: 4, pitch: 67, duration: 2, velocity: 72 },
  { beat: 6, pitch: 65, duration: 1, velocity: 80 },
  { beat: 7, pitch: 63, duration: 1, velocity: 78 },
  { beat: 8, pitch: 44, duration: 4, velocity: 92 },
  { beat: 8, pitch: 56, duration: 1, velocity: 85 },
  { beat: 9, pitch: 60, duration: 1, velocity: 82 },
  { beat: 10, pitch: 63, duration: 1, velocity: 84 },
  { beat: 11, pitch: 68, duration: 1, velocity: 80 },
  { beat: 12, pitch: 44, duration: 4, velocity: 88 },
  { beat: 12, pitch: 63, duration: 4, velocity: 76 },
  { beat: 12, pitch: 68, duration: 2, velocity: 72 },
  { beat: 14, pitch: 65, duration: 2, velocity: 78 },
  { beat: 16, pitch: 46, duration: 4, velocity: 95 },
  { beat: 16, pitch: 58, duration: 1, velocity: 90 },
  { beat: 16, pitch: 62, duration: 1, velocity: 85 },
  { beat: 16, pitch: 65, duration: 1, velocity: 80 },
  { beat: 17, pitch: 58, duration: 0.5, velocity: 65 },
  { beat: 18, pitch: 58, duration: 2, velocity: 88 },
  { beat: 18, pitch: 62, duration: 2, velocity: 82 },
  { beat: 18, pitch: 65, duration: 2, velocity: 78 },
  { beat: 20, pitch: 46, duration: 4, velocity: 90 },
  { beat: 20, pitch: 58, duration: 1, velocity: 86 },
  { beat: 21, pitch: 62, duration: 1, velocity: 84 },
  { beat: 22, pitch: 65, duration: 1, velocity: 82 },
  { beat: 23, pitch: 70, duration: 1, velocity: 88 },
  { beat: 24, pitch: 43, duration: 8, velocity: 92 },
  { beat: 24, pitch: 55, duration: 1, velocity: 90 },
  { beat: 25, pitch: 59, duration: 1, velocity: 86 },
  { beat: 26, pitch: 62, duration: 1, velocity: 88 },
  { beat: 27, pitch: 67, duration: 1, velocity: 84 },
  { beat: 28, pitch: 71, duration: 1, velocity: 92 },
  { beat: 29, pitch: 74, duration: 1, velocity: 96 },
  { beat: 30, pitch: 79, duration: 2, velocity: 100 },
  { beat: 32, pitch: 36, duration: 8, velocity: 85 },
  { beat: 32, pitch: 48, duration: 8, velocity: 78 },
  { beat: 32, pitch: 60, duration: 8, velocity: 82 },
  { beat: 32, pitch: 63, duration: 8, velocity: 76 },
  { beat: 32, pitch: 67, duration: 8, velocity: 72 },
  { beat: 32, pitch: 72, duration: 8, velocity: 68 },
  { beat: 40, pitch: 36, duration: 8, velocity: 75 },
  { beat: 40, pitch: 48, duration: 8, velocity: 70 },
  { beat: 40, pitch: 60, duration: 8, velocity: 72 },
  { beat: 40, pitch: 63, duration: 8, velocity: 66 },
  { beat: 40, pitch: 67, duration: 4, velocity: 62 },
  { beat: 44, pitch: 65, duration: 4, velocity: 58 },
];

const PianoRollView = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;

    if (!container) return;
    container.scrollTop = (MAX_PITCH - 58) * KEY_HEIGHT - container.clientHeight / 2;
  }, []);

  return (
    <div className="bg-surface flex flex-col" style={{ height: `calc(100vh - ${CHROME_HEIGHT}px)` }}>
      <ViewHeader
        title="KEYS"
        metadata={[
          { label: 'CHROMATIC', className: 'text-dimmed' },
          { label: '4/4', className: 'text-border' },
        ]}
      />

      <div
        ref={scrollRef}
        className="flex-1 overflow-auto scrollbar-ruler"
      >
        <div style={{ display: 'grid', gridTemplateColumns: `${PIANO_WIDTH}px ${gridWidth}px`, gridTemplateRows: `${RULER_HEIGHT}px ${GRID_HEIGHT}px` }}>
          {/* Top-left corner — sticky to both top and left */}
          <div
            className="bg-surface border-b border-border"
            style={{ position: 'sticky', top: 0, left: 0, zIndex: 3 }}
          />

          {/* Ruler — sticky to top */}
          <div className="border-b border-border" style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            <BeatRuler totalBars={TOTAL_BARS} beatsPerBar={BEATS_PER_BAR} pixelsPerBeat={PIXELS_PER_BEAT} />
          </div>

          {/* Piano keys — sticky to left */}
          <div className="border-r border-border" style={{ position: 'sticky', left: 0, zIndex: 2 }}>
            <PianoKeys keyHeight={KEY_HEIGHT} />
          </div>

          {/* Grid — notes area */}
          <div className="relative">
            {Array.from({ length: TOTAL_KEYS }, (_, row) => {
              if (!BLACK_KEYS.has((MAX_PITCH - row) % 12)) return null;

              return (
                <div
                  key={`bk${row}`}
                  className="absolute left-0 bg-border opacity-[0.08]"
                  style={{ top: row * KEY_HEIGHT, width: gridWidth, height: KEY_HEIGHT }}
                />
              );
            })}
            {Array.from({ length: TOTAL_KEYS + 1 }, (_, row) => (
              <div
                key={`h${row}`}
                className="absolute left-0 bg-border"
                style={{
                  top: row * KEY_HEIGHT,
                  width: gridWidth,
                  height: 1,
                  opacity: row > 0 && (MAX_PITCH - row + 1) % 12 === 0 ? 0.5 : 0.12,
                }}
              />
            ))}
            {Array.from({ length: totalBeats + 1 }, (_, beat) => (
              <div
                key={`v${beat}`}
                className="absolute top-0 bg-border"
                style={{
                  left: beat * PIXELS_PER_BEAT,
                  width: 1,
                  height: GRID_HEIGHT,
                  opacity: beat % BEATS_PER_BAR === 0 ? 0.4 : 0.15,
                }}
              />
            ))}
            {hardcodedNotes.map((note, ix) => (
              <div
                key={ix}
                className="absolute box-border"
                style={{
                  top: (MAX_PITCH - note.pitch) * KEY_HEIGHT,
                  left: note.beat * PIXELS_PER_BEAT,
                  width: note.duration * PIXELS_PER_BEAT,
                  height: KEY_HEIGHT,
                  backgroundColor: 'var(--color-unit-1)',
                  opacity: 0.4 + (note.velocity / 127) * 0.6,
                  borderLeft: '1px solid color-mix(in srgb, var(--color-unit-1) 80%, white 20%)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoRollView;
