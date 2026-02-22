import type { CompiledGapNode } from '../compiled'
import { resolveDuration } from '../duration'
import type { Duration } from '../duration'
import type { Pattern } from './pattern'

export class GapPattern implements Pattern {
  readonly type = 'gap' as const

  constructor(readonly duration: Duration) {}

  compile(startTick: number): CompiledGapNode {
    const durationTicks = resolveDuration(this.duration)
    return { type: 'gap', startTick, durationTicks }
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
