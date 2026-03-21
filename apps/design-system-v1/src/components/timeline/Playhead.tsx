import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

interface PlayheadProps {
  animated?: boolean;
  position?: number;
  className?: string;
}

export function Playhead({
  animated = false,
  position: externalPosition,
  className,
}: PlayheadProps) {
  const [internalPosition, setInternalPosition] = useState(0.25);
  const animationRef = useRef(0);

  useEffect(() => {
    if (!animated) {
      return;
    }

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = (elapsed / 8) % 1;

      setInternalPosition(progress);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [animated]);

  const pos = externalPosition ?? internalPosition;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      <div
        className="absolute top-0 h-full"
        style={{
          left: `${String(pos * 100)}%`,
          transform: "translateX(-50%)",
        }}
      >
        <svg
          width={6}
          height={6}
          viewBox="0 0 6 6"
          className="absolute left-1/2 top-0 -translate-x-1/2"
        >
          <polygon
            points="0,0 6,0 3,6"
            fill="var(--gold-500)"
          />
        </svg>
        <div
          className="absolute left-1/2 top-0 h-full -translate-x-1/2"
          style={{
            width: 1,
            backgroundColor: "var(--gold-500)",
            boxShadow: "0 0 6px var(--gold-glow)",
          }}
        />
      </div>
    </div>
  );
}
