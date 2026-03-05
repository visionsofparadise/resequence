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
export type { CustomPatternProperties } from "./patterns/custom-pattern";
export { CustomPattern, custom } from "./patterns/custom-pattern";
export { LayerPattern, layer } from "./patterns/layer";
export { SequencePattern, sequence, toPattern } from "./patterns/sequence";

export { extentOf } from "./utils/extent";
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
