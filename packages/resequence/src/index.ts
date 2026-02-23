/* eslint-disable barrel-files/avoid-barrel-files */
export { bars, beats, PPQ, resolveDuration } from "./duration";
export type { Duration } from "./duration";

export { resolvePitch } from "./pitch";
export type { Pitch } from "./pitch";

export { compressor, delay, effects, filter, gain, highpass, lowpass, pan, reverb } from "./effect";
export type { CompressorEffect, DelayEffect, Effect as EffectDefinition, EffectsChain, FilterEffect, FilterMode, GainEffect, PanEffect, ReverbEffect } from "./effect";

export { instrument, Instrument as InstrumentDefinition, kit } from "./instrument";
export type { Envelope, InstrumentZone, KitMapping } from "./instrument";

export type { Pattern, PositionedNote } from "./patterns/pattern";
export { MidiPattern, RoutedPattern } from "./patterns/pattern";

export { automate, AutomatePattern } from "./patterns/automate";
export type { AutomationCurve, AutomationPoint } from "./patterns/automate";
export { gap, GapPattern } from "./patterns/gap";
export { layer, LayerPattern } from "./patterns/layer";
export { metadata, MetadataPattern } from "./patterns/metadata";
export { note, NotePattern } from "./patterns/note";
export { repeat, RepeatPattern } from "./patterns/repeat";
export { sample, SamplePattern } from "./patterns/sample";
export { sequence, SequencePattern } from "./patterns/sequence";

export { trigger } from "./trigger";
export type { TriggerOptions } from "./trigger";
export { invert } from "./invert";
export { sidechain } from "./sidechain";
export type { SidechainOptions } from "./sidechain";
export { lfo } from "./lfo";
export type { LfoOptions, LfoShape } from "./lfo";
export { formula } from "./formula";
export type { FormulaOptions } from "./formula";

export { chord } from "./chord";
export { scale } from "./scale";
export type { ScaleAccessor } from "./scale";
