import type { IconProps } from './PrimaryIcon'

const DotCircleIcon = ({ color, size = 32, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
    <circle cx="16" cy="16" r="14.5" stroke={color} fill="none" strokeWidth="1" />
    <circle cx="16" cy="16" r="3" fill={color} />
  </svg>
)

export default DotCircleIcon
