import { useState, useEffect, useRef } from 'react';

const Meter = ({
  level,
  height = 80,
  width = 4,
  animated = false,
  className,
}: {
  level: number;
  height?: number;
  width?: number;
  animated?: boolean;
  className?: string;
}) => {
  const [displayLevel, setDisplayLevel] = useState(level);
  const levelRef = useRef(displayLevel);

  useEffect(() => {
    if (!animated) {
      setDisplayLevel(level);

      return;
    }

    levelRef.current = level;
    let frameId: number;
    let lastTime = 0;

    const tick = (time: number) => {
      if (time - lastTime >= 60) {
        lastTime = time;
        setDisplayLevel((prev) => {
          const next = prev + (Math.random() - 0.5) * 0.15;

          return Math.max(0, Math.min(1, next));
        });
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [animated, level]);

  return (
    <div className={`relative bg-elevated${className ? ` ${className}` : ''}`} style={{ width, height }}>
      <div
        className="absolute bottom-0 w-full"
        style={{
          height: `${displayLevel * 100}%`,
          background: 'linear-gradient(to top, var(--color-text-primary), var(--color-accent-primary))',
        }}
      />
    </div>
  );
};

export default Meter;
