import type { IconProps } from './PrimaryIcon'

const LinesIcon = ({ color, size = 32, className }: IconProps) => (
  <div className={`flex flex-col justify-between${className ? ` ${className}` : ''}`} style={{ width: size, height: size }}>
    {Array.from({ length: 8 }, (_, ix) => (
      <div
        key={ix}
        style={{
          width: `${60 + ((ix * 37) % 41)}%`,
          height: 1,
          backgroundColor: color,
          opacity: ix % 2 === 0 ? 1 : 0.4,
        }}
      />
    ))}
  </div>
)

export default LinesIcon
