import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

interface KeyframePoint {
  xx: number;
  yy: number;
}

const DEMO_KEYFRAMES: Array<KeyframePoint> = [
  { xx: 0.0, yy: 0.3 },
  { xx: 0.15, yy: 0.8 },
  { xx: 0.35, yy: 0.55 },
  { xx: 0.5, yy: 0.9 },
  { xx: 0.7, yy: 0.4 },
  { xx: 0.85, yy: 0.7 },
  { xx: 1.0, yy: 0.5 },
];

function resolveColor(property: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(property)
    .trim();
}

interface AutomationCurveProps {
  height?: number;
  className?: string;
}

export function AutomationCurve({
  height = 100,
  className,
}: AutomationCurveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorsRef = useRef({
    gold500: "",
    surface3: "",
  });

  useEffect(() => {
    colorsRef.current = {
      gold500: resolveColor("--gold-500"),
      surface3: resolveColor("--surface-3"),
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
    const colors = colorsRef.current;
    const padding = 6;

    const points = DEMO_KEYFRAMES.map((kf) => ({
      px: padding + kf.xx * (cw - padding * 2),
      py: padding + (1 - kf.yy) * (ch - padding * 2),
    }));

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    if (!firstPoint || !lastPoint) {
      return;
    }

    const drawCurvePath = () => {
      context.moveTo(firstPoint.px, firstPoint.py);

      for (let ii = 1; ii < points.length; ii++) {
        const prev = points[ii - 1];
        const curr = points[ii];

        if (!prev || !curr) {
          continue;
        }

        const cpx = (prev.px + curr.px) / 2;

        context.bezierCurveTo(cpx, prev.py, cpx, curr.py, curr.px, curr.py);
      }
    };

    context.beginPath();
    drawCurvePath();
    context.lineTo(lastPoint.px, ch);
    context.lineTo(firstPoint.px, ch);
    context.closePath();

    const gradient = context.createLinearGradient(0, 0, 0, ch);

    gradient.addColorStop(0, `${colors.gold500}33`);
    gradient.addColorStop(1, "transparent");
    context.fillStyle = gradient;
    context.fill();

    context.beginPath();
    drawCurvePath();

    context.strokeStyle = colors.gold500;
    context.lineWidth = 1.5;
    context.stroke();

    for (const pt of points) {
      context.beginPath();
      context.arc(pt.px, pt.py, 3, 0, Math.PI * 2);
      context.fillStyle = colors.surface3;
      context.fill();
      context.strokeStyle = colors.gold500;
      context.lineWidth = 1.5;
      context.stroke();
    }
  }, [height]);

  return (
    <div
      className={cn(
        "rounded-[4px] border border-border-default bg-surface-1",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height, display: "block" }}
      />
    </div>
  );
}
