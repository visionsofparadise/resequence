import type { EffectDefinition } from '../effect'
import type { InstrumentDefinition } from '../instrument'
import type { Pattern } from './pattern'

export class AssignPattern implements Pattern {
  readonly type = 'assign' as const
  readonly durationTicks: number

  constructor(
    readonly node: Pattern,
    readonly track: string,
    readonly instrument?: InstrumentDefinition,
    readonly audio?: string,
    readonly effects?: ReadonlyArray<EffectDefinition>,
  ) {
    this.durationTicks = node.durationTicks
  }

  transpose(interval: number): AssignPattern {
    return new AssignPattern(this.node.transpose(interval), this.track, this.instrument, this.audio, this.effects)
  }

  reverse(): AssignPattern {
    return new AssignPattern(this.node.reverse(), this.track, this.instrument, this.audio, this.effects)
  }
}

export function assign(
  node: Pattern,
  config: {
    track: string
    instrument?: InstrumentDefinition
    audio?: string
    effects?: ReadonlyArray<EffectDefinition>
  },
): AssignPattern {
  return new AssignPattern(node, config.track, config.instrument, config.audio, config.effects)
}
