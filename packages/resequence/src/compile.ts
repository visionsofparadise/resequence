import type { CompiledNode, CompiledSequence } from './compiled'
import { PPQ } from './duration'
import type { Pattern } from './pattern'
import { compileAssign, compileGap, compileLayer, compileNote, compileRepeat, compileSequence } from './pattern'

export interface CompileConfig {
  readonly tempo: number
  readonly key: string
  readonly timeSignature: readonly [number, number]
}

function compileNode(pattern: Pattern, startTick: number): CompiledNode {
  switch (pattern.type) {
    case 'note': return compileNote(pattern, startTick)
    case 'gap': return compileGap(pattern, startTick)
    case 'sequence': return compileSequence(pattern, startTick, compileNode)
    case 'layer': return compileLayer(pattern, startTick, compileNode)
    case 'repeat': return compileRepeat(pattern, startTick, compileNode)
    case 'assign': return compileAssign(pattern, startTick, compileNode)
  }
}

export function compile(pattern: Pattern, config: CompileConfig): CompiledSequence {
  const tree = compileNode(pattern, 0)

  return {
    tempo: config.tempo,
    key: config.key,
    timeSignature: config.timeSignature,
    ppq: PPQ,
    durationTicks: tree.durationTicks,
    tree,
  }
}
