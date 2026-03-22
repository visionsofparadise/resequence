export interface IconProps {
  color: string
  size?: number
  className?: string
}

const PrimaryIcon = ({ color, size = 32, className }: IconProps) => (
  <div style={{ width: size, height: size, backgroundColor: color }} className={className} />
)

export default PrimaryIcon
