import { resolveDuration } from '../duration'
import type { Duration } from '../duration'
import type { Pattern } from './pattern'

export class LayerPattern implements Pattern {
  readonly type = 'layer' as const
  readonly durationTicks: number

  constructor(
    readonly nodes: ReadonlyArray<Pattern>,
    readonly duration?: Duration,
  ) {
    this.durationTicks =
      duration !== undefined
        ? resolveDuration(duration)
        : Math.max(0, ...nodes.map((node) => node.durationTicks))
  }

  transpose(interval: number): LayerPattern {
    return new LayerPattern(
      this.nodes.map((child) => child.transpose(interval)),
      this.duration,
    )
  }

  reverse(): LayerPattern {
    return new LayerPattern(
      this.nodes.map((child) => child.reverse()),
      this.duration,
    )
  }
}

export function layer(...nodes: ReadonlyArray<Pattern>): LayerPattern {
  return new LayerPattern(nodes)
}
