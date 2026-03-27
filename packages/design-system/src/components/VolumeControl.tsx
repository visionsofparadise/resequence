import { cn } from '../cn'

export interface VolumeControlProps extends React.ComponentPropsWithRef<'div'> {
  level: number
  steps?: number
  barWidth?: number
  barHeight?: number
}

const VolumeControl = ({
  level,
  steps = 24,
  barWidth = 3,
  barHeight = 10,
  className,
  ref,
  ...rest
}: VolumeControlProps) => {
  const filled = Math.round(level * steps)

  return (
    <div ref={ref} className={cn('flex items-end gap-px', className)} {...rest}>
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
