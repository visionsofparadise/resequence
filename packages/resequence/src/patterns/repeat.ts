import type { CompiledRepeatNode } from '../compiled'
import type { Pattern } from './pattern'

export class RepeatPattern implements Pattern {
  readonly type = 'repeat' as const

  constructor(
    readonly node: Pattern,
    readonly count: number,
  ) {}

  compile(startTick: number): CompiledRepeatNode {
    const child = this.node.compile(startTick)
    const durationTicks = child.durationTicks * this.count
    return { type: 'repeat', startTick, durationTicks, count: this.count, node: child }
  }

  transpose(interval: number): RepeatPattern {
    return new RepeatPattern(this.node.transpose(interval), this.count)
  }

  reverse(): RepeatPattern {
    return new RepeatPattern(this.node.reverse(), this.count)
  }
}

export function repeat(node: Pattern, count: number): RepeatPattern {
  return new RepeatPattern(node, count)
}
