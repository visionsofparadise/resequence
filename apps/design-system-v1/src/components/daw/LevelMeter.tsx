import { useCallback, useEffect, useRef } from "react";

interface LevelMeterProps {
  level: number;
  peak?: number;
  stereo?: boolean;
  height?: number;
  width?: number;
  className?: string;
}

interface MeterColors {
  green: string;
  yellow: string;
  red: string;
  unlit: string;
}

interface MeterState {
  animationId: number;
  peakLevel: number;
  peakTimestamp: number;
  clipped: boolean;
  colors: MeterColors;
}

const SEGMENT_HEIGHT = 2;
const SEGMENT_GAP = 1;
const SEGMENT_STEP = SEGMENT_HEIGHT + SEGMENT_GAP;
const PEAK_HOLD_DURATION = 1500;
const PEAK_DECAY_RATE = 20;

function resolveColor(property: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(property)
    .trim();
}

function getSegmentColor(
  position: number,
  colors: MeterColors,
): string {
  if (position > 0.9) {
    return colors.red;
  }

  if (position > 0.75) {
    return colors.yellow;
  }

  return colors.green;
}

function drawMeter(
  context: CanvasRenderingContext2D,
  meterWidth: number,
  meterHeight: number,
  level: number,
  peakLevel: number,
  clipped: boolean,
  colors: MeterColors,
): void {
  const totalSegments = Math.floor(meterHeight / SEGMENT_STEP);

  context.clearRect(0, 0, meterWidth, meterHeight);

  for (let ii = 0; ii < totalSegments; ii++) {
    const position = (totalSegments - ii) / totalSegments;
    const yy = ii * SEGMENT_STEP;
    const isLit = level >= position;
    const isPeak = Math.abs(peakLevel - position) < 1 / totalSegments && peakLevel > 0.01;
    const isClip = ii === 0 && clipped;

    if (isClip) {
      context.fillStyle = colors.red;
    } else if (isPeak) {
      context.fillStyle = getSegmentColor(position, colors);
    } else if (isLit) {
      context.fillStyle = getSegmentColor(position, colors);
    } else {
      context.fillStyle = colors.unlit;
    }

    context.fillRect(0, yy, meterWidth, SEGMENT_HEIGHT);
  }
}

export function LevelMeter({
  level,
  peak,
  stereo = false,
  height = 120,
  width = 8,
  className,
}: LevelMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<MeterState>({
    animationId: 0,
    peakLevel: 0,
    peakTimestamp: 0,
    clipped: false,
    colors: { green: "#5a9a3e", yellow: "#c4993c", red: "#c44040", unlit: "#2e2c29" },
  });
  const levelRef = useRef(level);
  const peakRef = useRef(peak);

  levelRef.current = level;
  peakRef.current = peak;

  const channelCount = stereo ? 2 : 1;
  const totalWidth = width * channelCount + (stereo ? 2 : 0);

  useEffect(() => {
    const colors: MeterColors = {
      green: resolveColor("--meter-green"),
      yellow: resolveColor("--meter-yellow"),
      red: resolveColor("--meter-red"),
      unlit: resolveColor("--surface-3"),
    };

    stateRef.current.colors = colors;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const dpr = window.devicePixelRatio;

    canvas.width = totalWidth * dpr;
    canvas.height = height * dpr;

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.scale(dpr, dpr);

    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = (now - lastTime) / 1000;

      lastTime = now;

      const state = stateRef.current;
      const currentLevel = levelRef.current;
      const externalPeak = peakRef.current;

      if (currentLevel > state.peakLevel) {
        state.peakLevel = currentLevel;
        state.peakTimestamp = now;
      }

      if (currentLevel >= 1) {
        state.clipped = true;
      }

      const peakAge = now - state.peakTimestamp;

      if (peakAge > PEAK_HOLD_DURATION) {
        state.peakLevel = Math.max(
          0,
          state.peakLevel - PEAK_DECAY_RATE * dt * 0.05,
        );
      }

      const effectivePeak = externalPeak ?? state.peakLevel;

      context.clearRect(0, 0, totalWidth, height);

      if (stereo) {
        drawMeter(context, width, height, currentLevel, effectivePeak, state.clipped, state.colors);
        context.save();
        context.translate(width + 2, 0);
        drawMeter(context, width, height, currentLevel * 0.85, effectivePeak * 0.85, state.clipped, state.colors);
        context.restore();
      } else {
        drawMeter(context, width, height, currentLevel, effectivePeak, state.clipped, state.colors);
      }

      state.animationId = requestAnimationFrame(animate);
    };

    stateRef.current.animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(stateRef.current.animationId);
    };
  }, [height, width, totalWidth, stereo]);

  const handleClick = useCallback(() => {
    stateRef.current.clipped = false;
  }, []);

  return (
    <div
      className={className}
      style={{
        width: totalWidth + 4,
        height: height + 4,
        padding: 2,
        boxShadow: "inset 0 2px 3px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.06), inset 0 0 1px rgba(0,0,0,0.3)",
        backgroundColor: "var(--surface-0)",
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.3)",
        cursor: "pointer",
      }}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        style={{ width: totalWidth, height, display: "block", filter: "drop-shadow(0 0 4px rgba(90, 154, 62, 0.3)) drop-shadow(0 0 2px rgba(184, 134, 46, 0.2))" }}
      />
    </div>
  );
}
