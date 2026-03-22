export interface BarcodeProps {
  widths?: Array<number>
  height?: number
  gap?: number
  color?: string
  className?: string
}

const DEFAULT_WIDTHS = [3,1,2,1,4,1,1,3,1,2,1,1,3,2,1,1,4,1,2,1,3,1,1,2,1,4,1,1,3,1,2,1,1,2,3,1,1,4,1,2,1,3,1,1,2,1,1,3,2,1]

const Barcode = ({
  widths = DEFAULT_WIDTHS,
  height = 48,
  gap = 1,
  color = 'var(--color-text-primary)',
  className,
}: BarcodeProps) => (
  <div className={`flex items-end${className ? ` ${className}` : ''}`} style={{ height, gap }}>
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
