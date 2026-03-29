/* eslint-disable barrel-files/avoid-barrel-files */
export { GeneratorUnit } from "./generators/generator";
export type { GeneratorUnitInput, GeneratorUnitProperties } from "./generators/generator";

// Effects — leaf
export { CompressorEffectUnit, compressor, limiter } from "./effects/compressor";
export type { CompressorProperties } from "./effects/compressor";
export { DelayEffectUnit, delay } from "./effects/delay";
export type { DelayProperties } from "./effects/delay";
export { FilterEffectUnit, allpass, bandpass, filter, highpass, highshelf, lowpass, lowshelf, notch, peaking } from "./effects/filter";
export type { FilterMode, FilterProperties } from "./effects/filter";
export { GainEffectUnit, fader, gain, linearGain } from "./effects/gain";
export type { GainProperties } from "./effects/gain";
export { PanEffectUnit, pan } from "./effects/pan";
export type { PanProperties } from "./effects/pan";
export { SpatialEffectUnit, spatial } from "./effects/spatial";
export type { SpatialProperties } from "./effects/spatial";
export { WaveShaperCurve, WaveShaperEffectUnit, distortion, waveshaper } from "./effects/waveshaper";
export type { Oversample, WaveShaperProperties } from "./effects/waveshaper";

// Effects — composite
export { AmEffectUnit, am } from "./effects/am";
export type { AmProperties } from "./effects/am";
export { BitcrushEffectUnit, bitcrush } from "./effects/bitcrush";
export type { BitcrushProperties } from "./effects/bitcrush";
export { CCEffectUnit } from "./effects/cc";
export type { CCProperties } from "./effects/cc";
export { ChannelEffectUnit, MidEffectUnit, SideEffectUnit, left, mid, right, side } from "./effects/channel";
export type { ChannelProperties, MidProperties, SideProperties } from "./effects/channel";
export { ChannelMergerUnit, channelMerger, merge } from "./effects/channel-merger";
export type { ChannelMergerProperties } from "./effects/channel-merger";
export { ChannelSplitterUnit, channelSplitter, split } from "./effects/channel-splitter";
export type { ChannelSplitterProperties } from "./effects/channel-splitter";
export { ChorusEffectUnit, chorus, flanger } from "./effects/chorus";
export type { ChorusProperties } from "./effects/chorus";
export { ConvolutionEffectUnit, convolution } from "./effects/convolution";
export type { ConvolutionProperties } from "./effects/convolution";
export { CrossoverEffectUnit, crossover, multiband } from "./effects/crossover";
export type { CrossoverOptions, CrossoverProperties } from "./effects/crossover";
export { DownsampleEffectUnit, downsample, sampleRate } from "./effects/downsample";
export type { DownsampleProperties } from "./effects/downsample";
export { EqEffectUnit, eq } from "./effects/eq";
export type { EqBand, EqProperties } from "./effects/eq";
export { LinkwitzRileyUnit, linkwitzRiley } from "./effects/linkwitz-riley";
export type { LinkwitzRileyProperties } from "./effects/linkwitz-riley";
export { midSide, stereoWidth, width } from "./effects/mid-side";
export { MixNode, mix } from "./effects/mix";
export type { MixProperties } from "./effects/mix";
export { PhaserEffectUnit, phaser } from "./effects/phaser";
export type { PhaserProperties } from "./effects/phaser";
export { ReverbEffectUnit, reverb } from "./effects/reverb";
export type { ReverbProperties } from "./effects/reverb";
export { RingModEffectUnit, ringmod } from "./effects/ringmod";
export type { RingModProperties } from "./effects/ringmod";
export { DeEssEffectUnit, deEss, deSibilance } from "./effects/de-ess";
export type { DeEssProperties } from "./effects/de-ess";
export { DeHumEffectUnit, deHum } from "./effects/de-hum";
export type { DeHumProperties } from "./effects/de-hum";

// Composites
export { BypassUnit, bypass } from "./composites/bypass";
export type { BypassProperties } from "./composites/bypass";
export { Chain, chain } from "./composites/chain";
export type { ChainProperties } from "./composites/chain";
export { Fan, fan } from "./composites/fan";
export type { FanProperties } from "./composites/fan";
export { InterceptUnit, intercept } from "./composites/intercept";
export type { InterceptOptions, InterceptProperties } from "./composites/intercept";

// Modulation
export { LfoUnit, lfo } from "./lfo";
export type { LfoProperties, WaveShape } from "./lfo";
export { MacroUnit, macro } from "./macro";
export type { MacroProperties } from "./macro";

// Generators
export { NoiseUnit, noise } from "./generators/noise";
export type { NoiseProperties } from "./generators/noise";
export { OscillatorUnit, osc, oscillator } from "./generators/oscillator";
export type { OscillatorProperties } from "./generators/oscillator";
export { SamplerUnit, sampler } from "./generators/sampler";
export type { SamplerProperties, SamplerZone } from "./generators/sampler";

// MIDI transforms
export { EnvelopeUnit, env, envelope } from "./midi/envelope";
export type { EnvelopeAdsr, EnvelopeProperties } from "./midi/envelope";
export { HarmonizeMidiUnit, harmonize } from "./midi/harmonize";
export type { HarmonizeProperties } from "./midi/harmonize";
export { HumanizeMidiUnit, humanize } from "./midi/humanize";
export type { HumanizeProperties } from "./midi/humanize";
export { NoteFilterMidiUnit, noteFilter } from "./midi/note-filter";
export type { NoteFilterProperties } from "./midi/note-filter";
export { PortamentoUnit, porta, portamento } from "./midi/portamento";
export type { PortamentoProperties } from "./midi/portamento";
export { VelocityCurveMidiUnit, velocityCurve } from "./midi/velocity-curve";
export type { VelocityCurveProperties } from "./midi/velocity-curve";

// Other
export { AnalyserUnit, analyser } from "./analyser";
export type { AnalyserProperties } from "./analyser";

// Targets
export { SpeakersUnit, speakers } from "./targets/speakers";
export type { SpeakersProperties } from "./targets/speakers";
export { WriteUnit, write } from "./targets/write";
export type { WriteProperties } from "./targets/write";

// Sources
export { ReadUnit, read } from "./sources/read";
export type { ReadProperties } from "./sources/read";
