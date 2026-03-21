import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

function resolveColor(property: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(property)
    .trim();
}

interface WaveformDisplayProps {
  height?: number;
  className?: string;
}

export function WaveformDisplay({
  height = 80,
  className,
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorsRef = useRef({
    gold500: "",
    borderSubtle: "",
  });

  useEffect(() => {
    colorsRef.current = {
      gold500: resolveColor("--gold-500"),
      borderSubtle: resolveColor("--border-subtle"),
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

    const cw = rect.width;
    const ch = rect.height;
    const centerY = ch / 2;
    const colors = colorsRef.current;
    const samples = Math.floor(cw);

    context.strokeStyle = colors.borderSubtle;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, centerY);
    context.lineTo(cw, centerY);
    context.stroke();

    const amplitudes: Array<number> = [];

    for (let ii = 0; ii < samples; ii++) {
      const tt = ii / samples;
      const envelope =
        Math.sin(tt * Math.PI) *
        (0.4 + 0.6 * Math.sin(tt * Math.PI * 3));
      const sine = Math.sin(tt * Math.PI * 2 * 24);
      const amplitude = Math.abs(sine * envelope);

      amplitudes.push(Math.min(1, amplitude));
    }

    context.fillStyle = `${colors.gold500}66`;
    context.beginPath();
    context.moveTo(0, centerY);

    for (let ii = 0; ii < samples; ii++) {
      const xx = (ii / samples) * cw;
      const amp = (amplitudes[ii] ?? 0) * (centerY - 2);

      context.lineTo(xx, centerY - amp);
    }

    context.lineTo(cw, centerY);

    for (let ii = samples - 1; ii >= 0; ii--) {
      const xx = (ii / samples) * cw;
      const amp = (amplitudes[ii] ?? 0) * (centerY - 2);

      context.lineTo(xx, centerY + amp);
    }

    context.closePath();
    context.fill();

    context.strokeStyle = colors.gold500;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, centerY);

    for (let ii = 0; ii < samples; ii++) {
      const xx = (ii / samples) * cw;
      const amp = (amplitudes[ii] ?? 0) * (centerY - 2);

      context.lineTo(xx, centerY - amp);
    }

    context.stroke();

    context.beginPath();
    context.moveTo(0, centerY);

    for (let ii = 0; ii < samples; ii++) {
      const xx = (ii / samples) * cw;
      const amp = (amplitudes[ii] ?? 0) * (centerY - 2);

      context.lineTo(xx, centerY + amp);
    }

    context.stroke();
  }, [height]);

  return (
    <div
      className={cn(
        "rounded-[4px] border border-border-default bg-surface-1",
        className,
      )}
      style={{ boxShadow: "var(--shadow-inset-md)" }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height, display: "block" }}
      />
    </div>
  );
}
