import type { IconProps } from './PrimaryIcon'

const CrosshatchIcon = ({ color, size = 32, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
    {Array.from({ length: 6 }, (_, ix) => (
      <line key={`h${ix}`} x1={0} y1={ix * 7} x2={32} y2={ix * 7} stroke={color} strokeWidth="1" opacity={0.6} />
    ))}
    {Array.from({ length: 6 }, (_, ix) => (
      <line key={`v${ix}`} x1={ix * 7} y1={0} x2={ix * 7} y2={32} stroke={color} strokeWidth="1" opacity={0.6} />
    ))}
  </svg>
)

export default CrosshatchIcon
