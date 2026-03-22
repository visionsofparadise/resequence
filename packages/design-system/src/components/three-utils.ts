import { useState, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Color } from 'three'

export function useThemeColors() {
  const [colors, setColors] = useState({ primary: '#E8E3DB', muted: '#B5AFA5', surface: '#1C1A17' })

  useEffect(() => {
    const update = () => {
      const style = getComputedStyle(document.documentElement)

      setColors({
        primary: style.getPropertyValue('--color-text-primary').trim() || '#E8E3DB',
        muted: style.getPropertyValue('--color-text-secondary').trim() || '#B5AFA5',
        surface: style.getPropertyValue('--color-surface').trim() || '#1C1A17',
      })
    }

    update()
    const observer = new MutationObserver(update)

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  return colors
}

export function SceneBackground({ color }: { color: string }) {
  const { scene } = useThree()

  useEffect(() => {
    scene.background = new Color(color)
  }, [color, scene])

  return null
}
