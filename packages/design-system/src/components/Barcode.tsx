import { cn } from '../cn'

export interface BarcodeProps extends Omit<React.ComponentPropsWithRef<'div'>, 'color'> {
  widths?: Array<number>
  height?: number
  gap?: number
  color?: string
}

const DEFAULT_WIDTHS = [3,1,2,1,4,1,1,3,1,2,1,1,3,2,1,1,4,1,2,1,3,1,1,2,1,4,1,1,3,1,2,1,1,2,3,1,1,4,1,2,1,3,1,1,2,1,1,3,2,1]

const Barcode = ({
  widths = DEFAULT_WIDTHS,
  height = 48,
  gap = 1,
  color = 'var(--color-text-primary)',
  className,
  style,
  ref,
  ...rest
}: BarcodeProps) => (
  <div ref={ref} className={cn('flex items-end', className)} style={{ height, gap, ...style }} {...rest}>
    {widths.map((barWidth, ix) => (
      <div
        key={ix}
        style={{
          width: barWidth,
          height: '100%',
          backgroundColor: ix % 2 === 0 ? color : 'transparent',
        }}
      />
    ))}
  </div>
)

export default Barcode
