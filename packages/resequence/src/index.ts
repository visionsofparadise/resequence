/* eslint-disable barrel-files/avoid-barrel-files */
export { ResequenceError } from "./error";

export { bars, beats, PPQ, resolveDuration } from "./utils/duration";
export type { Duration } from "./utils/duration";

export { resolvePitch } from "./utils/pitch";
export type { Pitch } from "./utils/pitch";

export { compressor, delay, effects, filter, gain, highpass, lowpass, pan, reverb } from "./instrument/effect";
export type { CompressorEffect, DelayEffect, Effect as EffectDefinition, EffectsChain, FilterEffect, FilterMode, GainEffect, PanEffect, ReverbEffect } from "./instrument/effect";

export { instrument, Instrument as InstrumentDefinition, kit } from "./instrument/instrument";
export type { InstrumentZone, KitMapping, KitVelocityLayer } from "./instrument/instrument";

export { envelopes, filterEnvelope, pitchEnvelope, volumeEnvelope } from "./instrument/envelope";
export type { EnvelopeAdsr, EnvelopeEffect, EnvelopesChain, FilterEnvelopeEffect, PitchEnvelopeEffect, VolumeEnvelopeEffect } from "./instrument/envelope";

export { MidiPattern, RoutedPattern } from "./patterns/pattern";
export type { Pattern, PositionedNote } from "./patterns/pattern";

export { automate, AutomatePattern } from "./patterns/automate";
export type { Keyframe, KeyframeCurve } from "./patterns/automate";
export { gap, GapPattern } from "./patterns/gap";
export { layer, LayerPattern } from "./patterns/layer";
export { metadata, MetadataPattern } from "./patterns/metadata";
export { note, NotePattern } from "./patterns/note";
export { repeat, RepeatPattern } from "./patterns/repeat";
export { sample, SamplePattern } from "./patterns/sample";
export { sequence, SequencePattern } from "./patterns/sequence";

export { formula } from "./automation/formula";
export type { FormulaOptions } from "./automation/formula";
export { invert } from "./automation/invert";
export { lfo } from "./automation/lfo";
export type { LfoOptions } from "./automation/lfo";
export { sidechain } from "./automation/sidechain";
export type { SidechainOptions } from "./automation/sidechain";
export { trigger } from "./automation/trigger";
export type { TriggerOptions } from "./automation/trigger";

export { resolveLfo, scheduleLfo } from "./utils/lfo";
export type { Lfo, LfoShape } from "./utils/lfo";

export { chord } from "./utils/chord";
export { scale } from "./utils/scale";
export type { ScaleAccessor } from "./utils/scale";

export { buildEffectsMap } from "./instrument/build-effects-map";
export { collectRouting } from "./rendering/collect-routing";
export type { RoutingEntry } from "./rendering/collect-routing";
export { encodeMidi } from "./rendering/encode-midi";
export type { MidiNote } from "./rendering/encode-midi";
export { encodeWav } from "./rendering/encode-wav";
export { extractMetadata } from "./rendering/extract-metadata";
export type { ExtractedMetadata } from "./rendering/extract-metadata";
export { renderMidi } from "./rendering/render-midi";
export type { MidiRenderOptions, MidiRenderResult } from "./rendering/render-midi";
export type { EffectsGraphEntry, ScheduleContext } from "./rendering/schedule-context";
export { ticksToSeconds } from "./rendering/ticks-to-seconds";

export { validate } from "./validate";
export type { ValidationWarning } from "./validate";
