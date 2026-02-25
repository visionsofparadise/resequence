import { ResequenceError } from "../error";

export const PPQ = 480

export type Duration =
  | '1n' | '2n' | '4n' | '8n' | '16n' | '32n'
  | '1n.' | '2n.' | '4n.' | '8n.' | '16n.'
  | '2t' | '4t' | '8t' | '16t'
  | number

const BEATS: Record<string, number> = {
  '1n': 4,
  '2n': 2,
  '4n': 1,
  '8n': 0.5,
  '16n': 0.25,
  '32n': 0.125,
  '1n.': 6,
  '2n.': 3,
  '4n.': 1.5,
  '8n.': 0.75,
  '16n.': 0.375,
  '2t': 4 / 3,
  '4t': 2 / 3,
  '8t': 1 / 3,
  '16t': 1 / 6,
}

export function resolveDuration(duration: Duration): number {
  if (typeof duration === 'number') return duration

  const beats = BEATS[duration]

  if (beats === undefined) throw new ResequenceError('UNKNOWN_DURATION', `Unknown duration: ${duration}`)

  return beats
}

export function bars(count: number, timeSignature: readonly [number, number] = [4, 4]): number {
  return count * timeSignature[0] * (4 / timeSignature[1])
}

export function ms(millis: number, bpm: number): number {
  return (millis / 1000) * (bpm / 60)
}

export function sec(seconds: number, bpm: number): number {
  return seconds * (bpm / 60)
}
