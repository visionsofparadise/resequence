import type { IconProps } from './PrimaryIcon'

const StairsIcon = ({ color, size = 32, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
    <rect x="0" y="0" width="8" height="32" fill={color} opacity="0.25" />
    <rect x="8" y="8" width="8" height="24" fill={color} opacity="0.45" />
    <rect x="16" y="16" width="8" height="16" fill={color} opacity="0.65" />
    <rect x="24" y="24" width="8" height="8" fill={color} />
  </svg>
)

export default StairsIcon
