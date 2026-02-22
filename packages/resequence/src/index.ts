/* eslint-disable barrel-files/avoid-barrel-files */
export { PPQ, resolveDuration, bars, beats } from './duration'
export type { Duration } from './duration'

export { resolvePitch } from './pitch'
export type { Pitch } from './pitch'

export type { Instrument } from './instrument'

export type { Pattern } from './patterns/pattern'

export { note, NotePattern } from './patterns/note'
export { gap, GapPattern } from './patterns/gap'
export { sequence, SequencePattern } from './patterns/sequence'
export { layer, LayerPattern } from './patterns/layer'
export { repeat, RepeatPattern } from './patterns/repeat'
export { assign, AssignPattern } from './patterns/assign'

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
export { scale } from './scale'
export type { ScaleAccessor } from './scale'
