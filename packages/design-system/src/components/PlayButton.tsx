import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ConeGeometry, DoubleSide, MathUtils, type Group } from 'three'
import { useThemeColors, SceneBackground } from './three-utils'
import { cn } from '../cn'

export interface PlayButtonProps extends React.ComponentPropsWithRef<'button'> {
  size?: number
  hovered?: boolean
}

const BASE_ROT_X = 0.4

function Pyramid({ hovered, colors }: { hovered: boolean; colors: { primary: string; muted: string } }) {
  const groupRef = useRef<Group>(null)

  const geometry = useMemo(() => {
    const geo = new ConeGeometry(0.7, 1.1, 4)

    geo.rotateY(Math.PI / 4)
    geo.translate(0, -1.1 / 2, 0)
    geo.rotateZ(-Math.PI / 2)

    return geo
  }, [])

  const targetRef = useRef(BASE_ROT_X)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    if (hovered) {
      groupRef.current.rotation.x += delta * 1.0
    } else {
      const current = groupRef.current.rotation.x
      const QUARTER = Math.PI / 2
      const nearest = BASE_ROT_X + Math.round((current - BASE_ROT_X) / QUARTER) * QUARTER

      targetRef.current = nearest
      groupRef.current.rotation.x = MathUtils.lerp(
        current,
        targetRef.current,
        1 - Math.pow(0.001, delta),
      )
    }
  })

  return (
    <group rotation={[0, -0.2, 0]} position={[0.65, 0, 0]}>
      <group ref={groupRef} rotation={[BASE_ROT_X, 0, 0]}>
        <mesh geometry={geometry}>
          <meshLambertMaterial
            color={hovered ? colors.primary : colors.muted}
            side={DoubleSide}
            flatShading
          />
        </mesh>
      </group>
    </group>
  )
}

const PlayButton = ({
  size = 48,
  hovered = false,
  className,
  ref,
  ...rest
}: PlayButtonProps) => {
  const colors = useThemeColors()

  return (
    <button
      ref={ref}
      type="button"
      aria-label="Play"
      style={{ width: size, height: size, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
      className={cn('focus-visible:ring-1 focus-visible:ring-text-secondary focus-visible:outline-none', className)}
      {...rest}
    >
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        dpr={2}
      >
        <SceneBackground color={colors.surface} />
        <ambientLight intensity={0.15} />
        <directionalLight position={[3, 1, 2]} intensity={1.5} />
        <Pyramid hovered={hovered} colors={colors} />
      </Canvas>
    </button>
  )
}

export default PlayButton
