import type { CompiledAssignNode } from '../compiled'
import type { Instrument } from '../instrument'
import type { Pattern } from './pattern'

export class AssignPattern implements Pattern {
  readonly type = 'assign' as const

  constructor(
    readonly node: Pattern,
    readonly track: string,
    readonly instrument?: Instrument,
  ) {}

  compile(startTick: number): CompiledAssignNode {
    const child = this.node.compile(startTick)
    return { type: 'assign', startTick, durationTicks: child.durationTicks, track: this.track, instrument: this.instrument, node: child }
  }

  transpose(interval: number): AssignPattern {
    return new AssignPattern(this.node.transpose(interval), this.track, this.instrument)
  }

  reverse(): AssignPattern {
    return new AssignPattern(this.node.reverse(), this.track, this.instrument)
  }
}

export function assign(node: Pattern, config: { track: string; instrument?: Instrument }): AssignPattern {
  return new AssignPattern(node, config.track, config.instrument)
}
