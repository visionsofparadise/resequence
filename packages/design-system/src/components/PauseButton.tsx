import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { BoxGeometry, MathUtils, type Mesh } from 'three'
import { useThemeColors, SceneBackground } from './three-utils'

export interface PauseButtonProps {
  size?: number
  hovered?: boolean
  onClick?: () => void
  className?: string
}

function PauseBar({ position, hovered, colors }: { position: [number, number, number]; hovered: boolean; colors: { primary: string; muted: string } }) {
  const meshRef = useRef<Mesh>(null)
  const barGeo = useMemo(() => new BoxGeometry(0.28, 1.2, 0.28), [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    if (hovered) {
      meshRef.current.rotation.y += delta * 1.0
    } else {
      const current = meshRef.current.rotation.y
      const HALF = Math.PI
      const nearest = Math.round(current / HALF) * HALF

      meshRef.current.rotation.y = MathUtils.lerp(
        current,
        nearest,
        1 - Math.pow(0.001, delta),
      )
    }
  })

  return (
    <mesh ref={meshRef} geometry={barGeo} position={position}>
      <meshLambertMaterial color={hovered ? colors.primary : colors.muted} flatShading />
    </mesh>
  )
}

function PauseBars({ hovered, colors }: { hovered: boolean; colors: { primary: string; muted: string } }) {
  return (
    <group rotation={[0.15, 0, 0]}>
      <PauseBar position={[-0.34, 0, 0]} hovered={hovered} colors={colors} />
      <PauseBar position={[0.34, 0, 0]} hovered={hovered} colors={colors} />
    </group>
  )
}

const PauseButton = ({
  size = 48,
  hovered = false,
  onClick,
  className,
}: PauseButtonProps) => {
  const colors = useThemeColors()

  return (
    <button
      type="button"
      aria-label="Pause"
      onClick={onClick}
      style={{ width: size, height: size, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
      className={`focus-visible:ring-1 focus-visible:ring-text-secondary focus-visible:outline-none${className ? ` ${className}` : ''}`}
    >
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        dpr={2}
      >
        <SceneBackground color={colors.surface} />
        <ambientLight intensity={0.15} />
        <directionalLight position={[3, 1, 2]} intensity={1.5} />
        <PauseBars hovered={hovered} colors={colors} />
      </Canvas>
    </button>
  )
}

export default PauseButton
