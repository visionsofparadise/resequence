import { cn } from '../cn'

export interface DotGridProps extends Omit<React.ComponentPropsWithRef<'div'>, 'color'> {
  columns?: number
  rows?: number
  dotSize?: number
  gap?: number
  color?: string
  dimColor?: string
}

const DotGrid = ({
  columns = 12,
  rows = 8,
  dotSize = 3,
  gap = 6,
  color = 'var(--color-text-primary)',
  dimColor = 'var(--color-dimmed)',
  className,
  style,
  ref,
  ...rest
}: DotGridProps) => (
  <div
    ref={ref}
    className={cn('grid', className)}
    style={{
      gridTemplateColumns: `repeat(${columns}, ${dotSize}px)`,
      gridTemplateRows: `repeat(${rows}, ${dotSize}px)`,
      gap,
      placeItems: 'center',
      ...style,
    }}
    {...rest}
  >
    {Array.from({ length: columns * rows }, (_, ix) => {
      const row = Math.floor(ix / columns)
      const col = ix % columns
      const isBorder = row === 0 || row === rows - 1 || col === 0 || col === columns - 1

      return (
        <div
          key={ix}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: isBorder ? color : dimColor,
          }}
        />
      )
    })}
  </div>
)

export default DotGrid
