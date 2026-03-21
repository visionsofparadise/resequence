import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

const SEMITONE_HEIGHT = 12;
const OCTAVE_COUNT = 2;
const ROW_COUNT = OCTAVE_COUNT * 12;
const TOTAL_HEIGHT = ROW_COUNT * SEMITONE_HEIGHT;

const BARS = 4;
const BEATS_PER_BAR = 4;
const SUBDIVISIONS = 4;

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const BLACK_KEY_INDICES = new Set([1, 3, 6, 8, 10]);

interface NoteRect {
  pitch: number;
  start: number;
  duration: number;
  velocity: number;
}

const DEMO_NOTES: Array<NoteRect> = [
  { pitch: 0, start: 0, duration: 4, velocity: 0.9 },
  { pitch: 4, start: 0, duration: 4, velocity: 0.85 },
  { pitch: 7, start: 0, duration: 4, velocity: 0.8 },
  { pitch: 12, start: 0, duration: 2, velocity: 0.7 },
  { pitch: 14, start: 2, duration: 2, velocity: 0.75 },
  { pitch: 16, start: 4, duration: 2, velocity: 0.65 },
  { pitch: 17, start: 6, duration: 1, velocity: 0.6 },
  { pitch: 19, start: 7, duration: 1, velocity: 0.55 },
  { pitch: 21, start: 8, duration: 4, velocity: 0.9 },
  { pitch: 12, start: 8, duration: 4, velocity: 0.85 },
  { pitch: 16, start: 8, duration: 4, velocity: 0.8 },
  { pitch: 19, start: 12, duration: 2, velocity: 0.7 },
  { pitch: 17, start: 14, duration: 2, velocity: 0.5 },
  { pitch: 7, start: 4, duration: 4, velocity: 0.6 },
  { pitch: 5, start: 4, duration: 4, velocity: 0.55 },
  { pitch: 0, start: 4, duration: 4, velocity: 0.85 },
];

function resolveColor(property: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(property)
    .trim();
}

interface PianoRollProps {
  className?: string;
}

export function PianoRoll({ className }: PianoRollProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorsRef = useRef({
    surface0: "",
    surface1: "",
    borderStrong: "",
    borderDefault: "",
    borderSubtle: "",
    gold500: "",
    gold600: "",
  });

  useEffect(() => {
    colorsRef.current = {
      surface0: resolveColor("--surface-0"),
      surface1: resolveColor("--surface-1"),
      borderStrong: resolveColor("--border-strong"),
      borderDefault: resolveColor("--border-default"),
      borderSubtle: resolveColor("--border-subtle"),
      gold500: resolveColor("--gold-500"),
      gold600: resolveColor("--gold-600"),
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.scale(dpr, dpr);

    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    const colors = colorsRef.current;

    const totalBeats = BARS * BEATS_PER_BAR;
    const beatWidth = canvasWidth / totalBeats;
    const subWidth = beatWidth / SUBDIVISIONS;

    for (let row = 0; row < ROW_COUNT; row++) {
      const semitone = (ROW_COUNT - 1 - row) % 12;
      const yy = row * SEMITONE_HEIGHT;

      context.fillStyle = BLACK_KEY_INDICES.has(semitone)
        ? colors.surface0
        : colors.surface1;
      context.fillRect(0, yy, canvasWidth, SEMITONE_HEIGHT);
    }

    for (let sub = 0; sub <= totalBeats * SUBDIVISIONS; sub++) {
      const xx = sub * subWidth;
      const isBeat = sub % SUBDIVISIONS === 0;
      const isBar = sub % (SUBDIVISIONS * BEATS_PER_BAR) === 0;

      if (isBar) {
        context.strokeStyle = colors.borderStrong;
        context.lineWidth = 1.5;
      } else if (isBeat) {
        context.strokeStyle = colors.borderDefault;
        context.lineWidth = 1;
      } else {
        context.strokeStyle = colors.borderSubtle;
        context.lineWidth = 0.5;
      }

      context.beginPath();
      context.moveTo(xx, 0);
      context.lineTo(xx, canvasHeight);
      context.stroke();
    }

    for (const note of DEMO_NOTES) {
      const yy = (ROW_COUNT - 1 - note.pitch) * SEMITONE_HEIGHT;
      const xx = (note.start / totalBeats) * canvasWidth;
      const noteWidth = (note.duration / totalBeats) * canvasWidth;
      const alpha = 0.3 + note.velocity * 0.7;

      context.fillStyle = colors.gold500;
      context.globalAlpha = alpha;
      context.fillRect(xx, yy, noteWidth, SEMITONE_HEIGHT);

      context.globalAlpha = 1;
      context.strokeStyle = colors.gold600;
      context.lineWidth = 1;
      context.strokeRect(xx + 0.5, yy + 0.5, noteWidth - 1, SEMITONE_HEIGHT - 1);
    }

    context.globalAlpha = 1;
  }, []);

  const sidebarNotes: Array<{ name: string; isC: boolean }> = [];

  for (let row = 0; row < ROW_COUNT; row++) {
    const semitone = (ROW_COUNT - 1 - row) % 12;
    const octave = Math.floor((ROW_COUNT - 1 - row) / 12) + 3;
    const name = `${NOTE_NAMES[semitone]}${String(octave)}`;
    const isC = semitone === 0;

    sidebarNotes.push({ name, isC });
  }

  return (
    <div
      className={cn(
        "flex rounded-[4px] border border-border-default",
        className,
      )}
      style={{ boxShadow: "var(--shadow-inset-md)" }}
    >
      <div
        className="shrink-0 bg-surface-1"
        style={{ width: 36 }}
      >
        {sidebarNotes.map((note, index) => (
          <div
            key={`${note.name}-${String(index)}`}
            className={cn(
              "flex items-center justify-end pr-[4px] font-mono text-[0.625rem] leading-[0.875rem]",
              note.isC
                ? "font-bold text-text-primary"
                : "text-text-tertiary",
            )}
            style={{ height: SEMITONE_HEIGHT }}
          >
            {note.name}
          </div>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: TOTAL_HEIGHT,
          display: "block",
        }}
      />
    </div>
  );
}
