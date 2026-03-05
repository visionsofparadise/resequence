/* eslint-disable barrel-files/avoid-barrel-files */
export type { BaseEvent, Event, Keyframe, NoteEvent } from "./events";
export type { Note } from "./note";
export { note } from "./note";
export type { Pitch } from "./pitch";
export { addSteps, denormalizePitch, normalizePitch, NUM_OCTAVES, pitchKey, pitchToCents, pitchToMidi } from "./pitch";
export type { Port } from "./port";
export type { EqualTuningInput, FrequencyTuningInput, ResolvedTuning, Tuning, TuningNote } from "./tuning";
export { addAliases, createIndexTuning, createTuning } from "./tuning";

export type { PatternProperties, RelativeChild, RelativeNote } from "./patterns/pattern";
export { Pattern } from "./patterns/pattern";
export type { MidiPatternProperties } from "./patterns/midi-pattern";
export { MidiPattern } from "./patterns/midi-pattern";
export type { ModifierProperties } from "./patterns/modifier-pattern";
export { ModifierPattern } from "./patterns/modifier-pattern";
export { PatternsError } from "./error";
export type { CustomPatternProperties } from "./patterns/custom-pattern";
export { CustomPattern, custom } from "./patterns/custom-pattern";
export { LayerPattern, layer } from "./patterns/layer";
export { SequencePattern, sequence, toPattern } from "./patterns/sequence";
export type { GapProperties } from "./patterns/gap";
export { GapPattern, gap } from "./patterns/gap";
export type { TempoOptions, TempoProperties } from "./patterns/tempo";
export { TempoPattern, tempo } from "./patterns/tempo";
export type { Metadata, MetadataProperties } from "./patterns/metadata";
export { MetadataPattern, metadata, tuning, timeSignature, marker, cue, region } from "./patterns/metadata";

// Validation
export type { ValidationWarning } from "./validate";
export { validate } from "./validate";

// Pitch modifiers
export type { TransposeProperties } from "./modifiers/transpose";
export { TransposePattern, transpose } from "./modifiers/transpose";
export type { FlipProperties } from "./modifiers/flip";
export { FlipPattern, flip } from "./modifiers/flip";
export type { InvertProperties } from "./modifiers/invert";
export { InvertPattern, invertChord } from "./modifiers/invert";
export type { HarmonizeProperties } from "./modifiers/harmonize";
export { HarmonizePattern, harmonize } from "./modifiers/harmonize";
export type { UnisonSpread, UnisonProperties } from "./modifiers/unison";
export { UnisonPattern, unison } from "./modifiers/unison";
export type { VoicingStyle, VoicingProperties } from "./modifiers/voicing";
export { VoicingPattern, voicing } from "./modifiers/voicing";
export { SlidePattern, slide } from "./modifiers/slide";

// Rhythm modifiers
export type { OffsetProperties } from "./modifiers/offset";
export { OffsetPattern, offset } from "./modifiers/offset";
export type { StretchProperties } from "./modifiers/stretch";
export { StretchPattern, stretch } from "./modifiers/stretch";
export { ReversePattern, reverse } from "./modifiers/reverse";
export type { RotateProperties } from "./modifiers/rotate";
export { RotatePattern, rotate } from "./modifiers/rotate";
export type { StrumOptions, StrumProperties } from "./modifiers/strum";
export { StrumPattern, strum } from "./modifiers/strum";
export type { QuantizeProperties } from "./modifiers/quantize";
export { QuantizePattern, quantize, shuffle } from "./modifiers/quantize";
export type { JitterProperties } from "./modifiers/jitter";
export { JitterPattern, jitter } from "./modifiers/jitter";
export type { ArpProperties } from "./modifiers/arp";
export { ArpPattern, arp, arpUp, arpDown, arpUpDown, arpRandom } from "./modifiers/arp";

// Dynamics modifiers
export type { AccentProperties } from "./modifiers/accent";
export { AccentPattern, accent } from "./modifiers/accent";
export type { LevelPropOptions, LevelProp, LevelConfig, LevelProperties } from "./modifiers/level";
export { LevelPattern, level, humanize } from "./modifiers/level";
export type { PolyphonyProperties } from "./modifiers/polyphony";
export { PolyphonyPattern, polyphony } from "./modifiers/polyphony";
export type { LengthProperties } from "./modifiers/length";
export { LengthPattern, length } from "./modifiers/length";
export type { LegatoProperties } from "./modifiers/legato";
export { LegatoPattern, legato } from "./modifiers/legato";
export type { TrimProperties } from "./modifiers/trim";
export { TrimPattern, trim } from "./modifiers/trim";
export type { GateProperties } from "./modifiers/gate";
export { GatePattern, gate } from "./modifiers/gate";
export type { HealProperties } from "./modifiers/heal";
export { HealPattern, heal } from "./modifiers/heal";

// Structure modifiers
export type { EchoProperties } from "./modifiers/echo";
export { EchoPattern, echo } from "./modifiers/echo";
export type { FlamProperties } from "./modifiers/flam";
export { FlamPattern, flam } from "./modifiers/flam";
export type { RepeatProperties } from "./modifiers/repeat";
export { RepeatPattern, repeat } from "./modifiers/repeat";
export type { ChopProperties } from "./modifiers/chop";
export { ChopPattern, chop } from "./modifiers/chop";
export type { SortKey, SortProperties } from "./modifiers/sort";
export { SortPattern, sort } from "./modifiers/sort";
export type { SpliceOptions, InsertOptions, SpliceProperties, InsertProperties } from "./modifiers/splice";
export { SplicePattern, InsertPattern, splice, insert } from "./modifiers/splice";
export type { SliceProperties } from "./modifiers/slice";
export { SlicePattern, slice } from "./modifiers/slice";

// Non-destructive primitives
export { MutePattern, mute } from "./modifiers/mute";
export { SkipPattern, skip } from "./modifiers/skip";
export { UnwrapPattern, unwrap } from "./modifiers/unwrap";
export type { OverrideCallback, OverrideProperties } from "./modifiers/override";
export { OverridePattern, override } from "./modifiers/override";
export type { RevertProperties } from "./modifiers/revert";
export { RevertPattern, revert } from "./modifiers/revert";

// Generators
export type { DistributeProperties } from "./generators/distribute";
export { DistributePattern, distribute } from "./generators/distribute";
export type { RandomVelocityRange, RandomOptions, RandomProperties } from "./generators/random";
export { RandomPattern, random } from "./generators/random";
export type { GenerativeCallback, GenerativeProperties } from "./generators/generative";
export { GenerativePattern, generative } from "./generators/generative";

export { extentOf } from "./utils/extent";
export type { NoteContext } from "./utils/walk";
export { collectNotes, walkNotes, walkPatterns } from "./utils/walk";
export { flatMapNotes, mapNotes, mapPatterns } from "./utils/map";
export { descendAndClone } from "./utils/descend";
export { applyCurve, evaluateAt } from "./utils/keyframe";
export type { MidiNote, MidiPitchBend } from "./rendering/encode-midi";
export { encodeMidi } from "./rendering/encode-midi";
export { renderAllEvents, renderMidi } from "./rendering/render-midi";

export { A432 } from "./tunings/a432";
export { BohlenPierce } from "./tunings/bohlen-pierce";
export type { ChromaticNamespace, ScaleAccessor } from "./tunings/chromatic";
export { Chromatic, CHROMATIC_TUNING, N } from "./tunings/chromatic";
export { I } from "./tunings/index-tuning";
export { Just } from "./tunings/just";
export { Meantone } from "./tunings/meantone";
export { Midi } from "./tunings/midi";
export { Pelog } from "./tunings/pelog";
export { Pythagorean } from "./tunings/pythagorean";
export { QuarterTone } from "./tunings/quarter-tone";
export { Slendro } from "./tunings/slendro";
export { Tet19 } from "./tunings/tet19";
export { Tet31 } from "./tunings/tet31";
export { Tet53 } from "./tunings/tet53";
export { Werckmeister } from "./tunings/werckmeister";
