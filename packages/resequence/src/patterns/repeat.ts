import type { Pattern } from './pattern'

export class RepeatPattern implements Pattern {
  readonly type = 'repeat' as const
  readonly durationTicks: number

  constructor(
    readonly node: Pattern,
    readonly count: number,
  ) {
    this.durationTicks = node.durationTicks * count
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
