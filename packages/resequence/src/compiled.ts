import type { Instrument } from './instrument'

export interface CompiledNoteNode {
  readonly type: 'note'
  readonly startTick: number
  readonly durationTicks: number
  readonly pitch: number
  readonly velocity: number
  readonly lyric?: string
}

export interface CompiledGapNode {
  readonly type: 'gap'
  readonly startTick: number
  readonly durationTicks: number
}

export interface CompiledSequenceNode {
  readonly type: 'sequence'
  readonly startTick: number
  readonly durationTicks: number
  readonly nodes: ReadonlyArray<CompiledNode>
}

export interface CompiledLayerNode {
  readonly type: 'layer'
  readonly startTick: number
  readonly durationTicks: number
  readonly nodes: ReadonlyArray<CompiledNode>
}

export interface CompiledRepeatNode {
  readonly type: 'repeat'
  readonly startTick: number
  readonly durationTicks: number
  readonly count: number
  readonly node: CompiledNode
}

export interface CompiledAssignNode {
  readonly type: 'assign'
  readonly startTick: number
  readonly durationTicks: number
  readonly track: string
  readonly instrument?: Instrument
  readonly node: CompiledNode
}

export type CompiledNode =
  | CompiledNoteNode
  | CompiledGapNode
  | CompiledSequenceNode
  | CompiledLayerNode
  | CompiledRepeatNode
  | CompiledAssignNode

export interface CompiledSequence {
  readonly tempo: number
  readonly key: string
  readonly timeSignature: readonly [number, number]
  readonly ppq: number
  readonly durationTicks: number
  readonly tree: CompiledNode
}
