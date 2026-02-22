import type { CompiledSequence } from './compiled'
import { PPQ } from './duration'
import type { Pattern } from './patterns/pattern'

export interface CompileConfig {
  readonly tempo: number
  readonly key: string
  readonly timeSignature: readonly [number, number]
}

export function compile(pattern: Pattern, config: CompileConfig): CompiledSequence {
  const tree = pattern.compile(0)

  return {
    tempo: config.tempo,
    key: config.key,
    timeSignature: config.timeSignature,
    ppq: PPQ,
    durationTicks: tree.durationTicks,
    tree,
  }
}
