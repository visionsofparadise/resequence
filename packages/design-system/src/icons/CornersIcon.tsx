import type { IconProps } from './PrimaryIcon'

const CornersIcon = ({ color, size = 32, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" className={className}>
    <rect x="0" y="0" width="8" height="8" fill={color} />
    <rect x="24" y="0" width="8" height="8" fill={color} />
    <rect x="0" y="24" width="8" height="8" fill={color} />
    <rect x="24" y="24" width="8" height="8" fill={color} />
    <rect x="12" y="12" width="8" height="8" fill={color} opacity="0.4" />
  </svg>
)

export default CornersIcon
