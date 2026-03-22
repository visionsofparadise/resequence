import type { IconProps } from './PrimaryIcon'

const DotGridIcon = ({ color, size = 32, className }: IconProps) => (
  <div
    className={`grid${className ? ` ${className}` : ''}`}
    style={{
      width: size,
      height: size,
      gridTemplateColumns: 'repeat(5, 1fr)',
      gridTemplateRows: 'repeat(5, 1fr)',
      placeItems: 'center',
    }}
  >
    {Array.from({ length: 25 }, (_, ix) => (
      <div
        key={ix}
        style={{
          width: 3,
          height: 3,
          borderRadius: '50%',
          backgroundColor: color,
          opacity: (ix % 5 === 0 || ix < 5 || ix >= 20 || ix % 5 === 4) ? 1 : 0.4,
        }}
      />
    ))}
  </div>
)

export default DotGridIcon
