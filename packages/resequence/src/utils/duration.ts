import { ResequenceError } from "../error";

export const PPQ = 480

export type Duration =
  | '1n' | '2n' | '4n' | '8n' | '16n' | '32n'
  | '1n.' | '2n.' | '4n.' | '8n.' | '16n.'
  | '2t' | '4t' | '8t' | '16t'
  | number

const TICKS: Record<string, number> = {
  '1n': PPQ * 4,
  '2n': PPQ * 2,
  '4n': PPQ,
  '8n': PPQ / 2,
  '16n': PPQ / 4,
  '32n': PPQ / 8,
  '1n.': PPQ * 4 * 1.5,
  '2n.': PPQ * 2 * 1.5,
  '4n.': PPQ * 1.5,
  '8n.': (PPQ / 2) * 1.5,
  '16n.': (PPQ / 4) * 1.5,
  '2t': (PPQ * 2 * 2) / 3,
  '4t': (PPQ * 2) / 3,
  '8t': PPQ / 3,
  '16t': (PPQ / 2) / 3,
}

export function resolveDuration(duration: Duration): number {
  if (typeof duration === 'number') return duration

  const ticks = TICKS[duration]

  if (ticks === undefined) throw new ResequenceError('UNKNOWN_DURATION', `Unknown duration: ${duration}`)
    
  return ticks
}

export function bars(count: number): number {
  return count * PPQ * 4
}

export function beats(count: number): number {
  return count * PPQ
}
