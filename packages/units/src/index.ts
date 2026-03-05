/* eslint-disable barrel-files/avoid-barrel-files */
export type { DriverEntry, UnitContext } from "./context";
export { createUnitContext } from "./context";
export type { NoteEvent, NoteSlide } from "./note-event";
export { getOrCreateDriver, driveParam, offsetParam, undriveParam, proxyDriver } from "./utils/driver";
export { buildCurve } from "./utils/build-curve";
export { scheduleSlideRamps } from "./utils/schedule-slides";
export type { Pitch } from "./utils/pitch";
export { pitchToMidi } from "./utils/pitch";
export type { ModDeclaration, UnitProperties, UnitInput, SetupResult } from "./unit";
export { Unit } from "./unit";
export type { NoteProperty, NoteModDeclaration, MidiUnitProperties, MidiUnitInput } from "./midi-unit";
export { MidiUnit } from "./midi-unit";
export type { GeneratorUnitProperties, GeneratorUnitInput } from "./generators/generator";
export { GeneratorUnit } from "./generators/generator";

// Effects — leaf
export type { GainProperties } from "./effects/gain";
export { GainEffectUnit, gain, fader, linearGain } from "./effects/gain";
export type { FilterMode, FilterProperties } from "./effects/filter";
export { FilterEffectUnit, filter, lowpass, highpass, bandpass, notch, allpass, peaking, lowshelf, highshelf } from "./effects/filter";
export type { PanProperties } from "./effects/pan";
export { PanEffectUnit, pan } from "./effects/pan";
export type { CompressorProperties } from "./effects/compressor";
export { CompressorEffectUnit, compressor, limiter } from "./effects/compressor";
export type { DelayProperties } from "./effects/delay";
export { DelayEffectUnit, delay } from "./effects/delay";
export type { Oversample, WaveShaperProperties } from "./effects/waveshaper";
export { WaveShaperEffectUnit, WaveShaperCurve, waveshaper, distortion } from "./effects/waveshaper";
export type { SpatialProperties } from "./effects/spatial";
export { SpatialEffectUnit, spatial } from "./effects/spatial";

// Effects — composite
export type { MixProperties } from "./effects/mix";
export { MixNode, mix } from "./effects/mix";
export type { LinkwitzRileyProperties } from "./effects/linkwitz-riley";
export { LinkwitzRileyUnit, linkwitzRiley } from "./effects/linkwitz-riley";
export type { EqBand, EqProperties } from "./effects/eq";
export { EqEffectUnit, eq } from "./effects/eq";
export type { ReverbProperties } from "./effects/reverb";
export { ReverbEffectUnit, reverb } from "./effects/reverb";
export type { ChorusProperties } from "./effects/chorus";
export { ChorusEffectUnit, chorus, flanger } from "./effects/chorus";
export type { PhaserProperties } from "./effects/phaser";
export { PhaserEffectUnit, phaser } from "./effects/phaser";
export type { ChannelSplitterProperties } from "./effects/channel-splitter";
export { ChannelSplitterUnit, channelSplitter, split } from "./effects/channel-splitter";
export type { ChannelMergerProperties } from "./effects/channel-merger";
export { ChannelMergerUnit, channelMerger, merge } from "./effects/channel-merger";
export type { ChannelProperties, MidProperties, SideProperties } from "./effects/channel";
export { ChannelEffectUnit, left, right, MidEffectUnit, mid, SideEffectUnit, side } from "./effects/channel";
export { midSide, width, stereoWidth } from "./effects/mid-side";
export type { CrossoverOptions, CrossoverProperties } from "./effects/crossover";
export { CrossoverEffectUnit, crossover, multiband } from "./effects/crossover";
export type { RingModProperties } from "./effects/ringmod";
export { RingModEffectUnit, ringmod } from "./effects/ringmod";
export type { AmProperties } from "./effects/am";
export { AmEffectUnit, am } from "./effects/am";
export type { ConvolutionProperties } from "./effects/convolution";
export { ConvolutionEffectUnit, convolution } from "./effects/convolution";
export type { BitcrushProperties } from "./effects/bitcrush";
export { BitcrushEffectUnit, bitcrush } from "./effects/bitcrush";
export type { DownsampleProperties } from "./effects/downsample";
export { DownsampleEffectUnit, downsample, sampleRate } from "./effects/downsample";
export type { CCProperties } from "./effects/cc";
export { CCEffectUnit } from "./effects/cc";

// Composites
export { Composite, flattenUnits } from "./composites/composite";
export type { ChainProperties } from "./composites/chain";
export { Chain, chain } from "./composites/chain";
export type { FanProperties } from "./composites/fan";
export { Fan, fan } from "./composites/fan";
export type { BypassProperties } from "./composites/bypass";
export { BypassUnit, bypass } from "./composites/bypass";
export type { InterceptOptions, InterceptProperties } from "./composites/intercept";
export { InterceptUnit, intercept } from "./composites/intercept";

// Modulation
export type { WaveShape, LfoProperties } from "./lfo";
export { LfoUnit, lfo } from "./lfo";
export type { MacroProperties } from "./macro";
export { MacroUnit, macro } from "./macro";

// Generators
export type { OscillatorProperties } from "./generators/oscillator";
export { OscillatorUnit, oscillator, osc } from "./generators/oscillator";
export type { SamplerZone, SamplerProperties } from "./generators/sampler";
export { SamplerUnit, sampler } from "./generators/sampler";
export type { NoiseProperties } from "./generators/noise";
export { NoiseUnit, noise } from "./generators/noise";

// MIDI transforms
export type { EnvelopeAdsr, EnvelopeProperties } from "./midi/envelope";
export { EnvelopeUnit, envelope, env } from "./midi/envelope";
export type { HarmonizeProperties } from "./midi/harmonize";
export { HarmonizeMidiUnit, harmonize as harmonizeMidi } from "./midi/harmonize";
export type { HumanizeProperties } from "./midi/humanize";
export { HumanizeMidiUnit, humanize as humanizeMidi } from "./midi/humanize";
export type { NoteFilterProperties } from "./midi/note-filter";
export { NoteFilterMidiUnit, noteFilter } from "./midi/note-filter";
export type { VelocityCurveProperties } from "./midi/velocity-curve";
export { VelocityCurveMidiUnit, velocityCurve } from "./midi/velocity-curve";
export type { PortamentoProperties } from "./midi/portamento";
export { PortamentoUnit, portamento, porta } from "./midi/portamento";

// Other
export type { AnalyserProperties } from "./analyser";
export { AnalyserUnit, analyser } from "./analyser";
export { OutUnit, out } from "./out";

// Utilities
export { walkUnits, collectUnits, mapUnits, descendUnit } from "./utils/graph";

// MIDI parsing
export { CC } from "./midi/cc";
export type { CCNumber } from "./midi/cc";
export type { TempoPoint } from "./midi/tempo-map";
export { tickToMs } from "./midi/tempo-map";
export { parseMidiFile } from "./midi/parse-midi";

// Rendering
export type { RenderAudioOptions } from "./rendering/render-audio";
export { renderAudio } from "./rendering/render-audio";
export type { ProcessAudioOptions } from "./rendering/process-audio";
export { processAudio } from "./rendering/process-audio";
export type { WavBitDepth } from "./rendering/encode-wav";
export { encodeWav } from "./rendering/encode-wav";
