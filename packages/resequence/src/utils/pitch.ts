import { ResequenceError } from "../error";

export type Pitch = string | number

const NOTE_NAMES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
}

const PITCH_REGEX = /^([A-G])(b|#)?(-1|[0-9])$/

export function resolvePitch(pitch: Pitch): number {
  if (typeof pitch === 'number') return pitch

  const match = PITCH_REGEX.exec(pitch) as [string, string, string | undefined, string] | null
  if (!match) throw new ResequenceError('INVALID_PITCH', `Invalid pitch: ${pitch}`)

  const [, noteName, accidental, octaveStr] = match
  const semitone = NOTE_NAMES[noteName] ?? 0
  const octave = parseInt(octaveStr, 10)
  const offset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0

  return (octave + 1) * 12 + semitone + offset
}
