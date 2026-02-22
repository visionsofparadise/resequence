/* eslint-disable barrel-files/avoid-barrel-files */
export { PPQ, resolveDuration, bars, beats } from './duration'
export type { Duration } from './duration'

export { resolvePitch } from './pitch'
export type { Pitch } from './pitch'

export type { InstrumentDefinition } from './instrument'
export type { EffectDefinition } from './effect'

export type { Pattern } from './patterns/pattern'

export { note, NotePattern } from './patterns/note'
export { gap, GapPattern } from './patterns/gap'
export { sequence, SequencePattern } from './patterns/sequence'
export { layer, LayerPattern } from './patterns/layer'
export { repeat, RepeatPattern } from './patterns/repeat'
export { assign, AssignPattern } from './patterns/assign'

export { chord } from './chord'
export { scale } from './scale'
export type { ScaleAccessor } from './scale'
