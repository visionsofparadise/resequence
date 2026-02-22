import type { Duration } from './duration'
import type { Instrument } from './instrument'
import type { Pitch } from './pitch'

export interface NoteNode {
  readonly type: 'note'
  readonly pitch: Pitch
  readonly duration: Duration
  readonly velocity: number
  readonly lyric?: string
}

export interface GapNode {
  readonly type: 'gap'
  readonly duration: Duration
}

export interface SequenceNode {
  readonly type: 'sequence'
  readonly nodes: ReadonlyArray<Pattern>
}

export interface LayerNode {
  readonly type: 'layer'
  readonly nodes: ReadonlyArray<Pattern>
  readonly duration?: Duration
}

export interface RepeatNode {
  readonly type: 'repeat'
  readonly node: Pattern
  readonly count: number
}

export interface AssignNode {
  readonly type: 'assign'
  readonly node: Pattern
  readonly track: string
  readonly instrument?: Instrument
}

export type Pattern =
  | NoteNode
  | GapNode
  | SequenceNode
  | LayerNode
  | RepeatNode
  | AssignNode
