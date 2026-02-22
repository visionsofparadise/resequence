import type { CompiledNode, CompiledSequenceNode } from '../compiled'
import type { Pattern } from './pattern'

export class SequencePattern implements Pattern {
  readonly type = 'sequence' as const

  constructor(readonly nodes: ReadonlyArray<Pattern>) {}

  compile(startTick: number): CompiledSequenceNode {
    let tick = startTick
    const children: Array<CompiledNode> = []

    for (const child of this.nodes) {
      const compiled = child.compile(tick)
      children.push(compiled)
      tick += compiled.durationTicks
    }

    return { type: 'sequence', startTick, durationTicks: tick - startTick, nodes: children }
  }

  transpose(interval: number): SequencePattern {
    return new SequencePattern(this.nodes.map((child) => child.transpose(interval)))
  }

  reverse(): SequencePattern {
    return new SequencePattern([...this.nodes].reverse().map((child) => child.reverse()))
  }
}

export function sequence(...nodes: ReadonlyArray<Pattern>): SequencePattern {
  return new SequencePattern(nodes)
}
