/* eslint-disable barrel-files/avoid-barrel-files */
export { PPQ, resolveDuration, bars, beats } from './duration'
export type { Duration } from './duration'

export { resolvePitch } from './pitch'
export type { Pitch } from './pitch'

export type { Instrument } from './instrument'

export { note, gap, sequence, layer, repeat, assign } from './pattern'
export type {
  Pattern,
  NoteNode,
  GapNode,
  SequenceNode,
  LayerNode,
  RepeatNode,
  AssignNode,
} from './pattern'

export type {
  CompiledNode,
  CompiledNoteNode,
  CompiledGapNode,
  CompiledSequenceNode,
  CompiledLayerNode,
  CompiledRepeatNode,
  CompiledAssignNode,
  CompiledSequence,
} from './compiled'

export { compile } from './compile'
export type { CompileConfig } from './compile'

export { chord } from './chord'
export { transpose } from './transpose'
export { reverse } from './reverse'
export { scale } from './scale'
export type { ScaleAccessor } from './scale'
