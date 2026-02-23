import { Scale } from 'tonal'
import { ResequenceError } from '../error'

export type ScaleAccessor = (degree: number, octave?: number) => string

const SCALE_REGEX = /^([A-G][#b]?)(\d)\s+(.+)/

export function scale(name: string): ScaleAccessor {
  const match = SCALE_REGEX.exec(name) as [string, string, string, string] | null
  if (!match) throw new ResequenceError('INVALID_SCALE_NAME', `Invalid scale name: ${name}`)

  const [, root, octaveStr, scaleType] = match
  const rootOctave = parseInt(octaveStr, 10)

  const scaleData = Scale.get(`${root} ${scaleType}`)
  if (scaleData.empty) throw new ResequenceError('UNKNOWN_SCALE', `Unknown scale: ${name}`)

  const pitchClasses = scaleData.notes

  return (degree: number, octave?: number): string => {
    const len = pitchClasses.length
    const zeroBased = degree > 0 ? degree - 1 : degree
    const index = ((zeroBased % len) + len) % len
    const octaveOffset = Math.floor(zeroBased / len)

    const pitchClass = pitchClasses[index]
    const resolvedOctave = octave ?? rootOctave + octaveOffset

    return `${pitchClass}${resolvedOctave}`
  }
}
