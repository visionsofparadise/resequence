import { resolveDuration } from '../duration'
import type { Duration } from '../duration'
import type { Pattern } from './pattern'

export class GapPattern implements Pattern {
  readonly type = 'gap' as const
  readonly durationTicks: number

  constructor(readonly duration: Duration) {
    this.durationTicks = resolveDuration(duration)
  }

  transpose(): GapPattern {
    return new GapPattern(this.duration)
  }

  reverse(): GapPattern {
    return new GapPattern(this.duration)
  }
}

export function gap(duration: Duration): GapPattern {
  return new GapPattern(duration)
}
