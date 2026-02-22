import type { CompiledLayerNode } from '../compiled'
import { resolveDuration } from '../duration'
import type { Duration } from '../duration'
import type { Pattern } from './pattern'

export class LayerPattern implements Pattern {
  readonly type = 'layer' as const

  constructor(
    readonly nodes: ReadonlyArray<Pattern>,
    readonly duration?: Duration,
  ) {}

  compile(startTick: number): CompiledLayerNode {
    const children = this.nodes.map((child) => child.compile(startTick))

    const durationTicks =
      this.duration !== undefined
        ? resolveDuration(this.duration)
        : Math.max(0, ...children.map((child) => child.durationTicks))

    return { type: 'layer', startTick, durationTicks, nodes: children }
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
