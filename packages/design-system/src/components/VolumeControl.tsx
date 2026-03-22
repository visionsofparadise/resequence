export interface VolumeControlProps {
  level: number
  steps?: number
  barWidth?: number
  barHeight?: number
  className?: string
}

const VolumeControl = ({
  level,
  steps = 24,
  barWidth = 3,
  barHeight = 10,
  className,
}: VolumeControlProps) => {
  const filled = Math.round(level * steps)

  return (
    <div className={`flex items-end gap-px${className ? ` ${className}` : ''}`}>
      {Array.from({ length: steps }, (_, ix) => (
        <div
          key={ix}
          style={{
            width: barWidth,
            height: barHeight,
            backgroundColor: ix < filled ? 'var(--color-text-primary)' : 'var(--color-dimmed)',
          }}
        />
      ))}
    </div>
  )
}

export default VolumeControl
