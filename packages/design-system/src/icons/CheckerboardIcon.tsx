import type { IconProps } from './PrimaryIcon'

const CheckerboardIcon = ({ color, size = 32, className }: IconProps) => {
  const cellSize = size / 4

  return (
    <div
      className={`grid${className ? ` ${className}` : ''}`}
      style={{
        width: size,
        height: size,
        gridTemplateColumns: `repeat(4, ${cellSize}px)`,
        gridTemplateRows: `repeat(4, ${cellSize}px)`,
      }}
    >
      {Array.from({ length: 16 }, (_, ix) => (
        <div
          key={ix}
          style={{
            backgroundColor: (Math.floor(ix / 4) + ix % 4) % 2 === 0 ? color : 'transparent',
          }}
        />
      ))}
    </div>
  )
}

export default CheckerboardIcon
