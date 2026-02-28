import { describe, expect, it } from 'vitest'
import {
  gap, sequence, layer, repeat,
  sampler, SamplerUnit,
  gain, highpass, compressor,
  env, EnvelopeUnit,
  audio, metadata, automate,
  bars,
  N, Chromatic,
  trigger, sidechain, formula, invert, resolveLfo,
  pitchToMidi,
  MetadataPattern, AutomatePattern, AudioPattern,
} from './index'
import { collectNotes } from './patterns/utils/tree'
describe('integration', () => {
  const bass = sampler('./samples/bass-C2.wav', { root: N.C2, id: 'bass' })
  const pad = sampler('./samples/pad-C3.wav', { root: N.C3, id: 'pad' })
  const drums = sampler([
    { sample: './samples/kick.wav', root: N.C1 },
    { sample: './samples/snare.wav', root: N.D1 },
    { sample: './samples/hat-closed.wav', root: N.Fs1 },
  ], { id: 'drums' })
  it('creates samplers', () => {
    expect(bass).toBeInstanceOf(SamplerUnit)
    expect(bass.id).toBe('bass')
    expect(drums).toBeInstanceOf(SamplerUnit)
    expect(drums.id).toBe('drums')
  })
  it('chains effects on instrument via .to()', () => {
    const inst = sampler('./samples/bass-C2.wav', { root: N.C2, id: 'test-inst' })
    const hp = highpass({ frequency: 80 })
    const comp = compressor({ threshold: -20, ratio: 4 })
    const g = gain({ level: -3 })
    inst.to(hp)
    hp.to(comp)
    comp.to(g)
    expect(inst.targets).toHaveLength(1)
    expect(inst.targets[0]).toBe(hp)
  })
  it('routes pattern to instrument with .route()', () => {
    const kickPattern = repeat(sequence(N.C1(1)), 4)
    const kickPart = kickPattern.route(drums)
    expect(kickPart.endBeat - kickPart.startBeat).toBe(4)
  })
  it('composes full arrangement', () => {
    const kickPattern = repeat(sequence(N.C1(1)), 4)
    const snarePattern = sequence(gap(1), N.D1(1), gap(1), N.D1(1))
    const bassRiff = sequence(N.C2(0.5), gap(0.5), N.C2(0.25), gap(0.25), N.C2(0.5))
    const groove = layer(kickPattern.route(drums), snarePattern.route(drums), bassRiff.route(bass))
    const verse = repeat(groove, 4)
    expect(groove.endBeat - groove.startBeat).toBe(4)
    expect(verse.endBeat - verse.startBeat).toBe(16)
  })
  it('creates named audio patterns', () => {
    const breakLoop = audio('break', './samples/break-140bpm.wav', 4)
    expect(breakLoop).toBeInstanceOf(AudioPattern)
    expect(breakLoop.name).toBe('break')
  })
  it('creates automation targeting effects', () => {
    const filterSweep = automate('filter-sweep', 'bass.hp.frequency', [
      { time: 0, value: 80 },
      { time: 4, value: 2000, curve: 'linear' },
      { time: bars(2), value: 80, curve: 'exponential' },
    ])
    expect(filterSweep).toBeInstanceOf(AutomatePattern)
    expect(filterSweep.endBeat - filterSweep.startBeat).toBe(bars(2))
  })
  it('accepts 2-segment automation paths', () => {
    const sweep = automate('sweep', 'bass.frequency', [
      { time: 0, value: 80 },
      { time: 4, value: 2000 },
    ])
    expect(sweep.paths).toEqual(['bass.frequency'])
  })
  it('creates multi-path automation', () => {
    const dualFilter = automate('dual-filter', ['bass.hp.frequency', 'pad.hp.frequency'], [
      { time: 0, value: 80 },
      { time: bars(4), value: 2000, curve: 'linear' },
    ])
    expect(dualFilter.paths).toHaveLength(2)
  })
  it('wraps with metadata', () => {
    const kickPart = repeat(sequence(N.C1(1)), 4).route(drums)
    const filterSweep = automate('filter-sweep', 'bass.hp.frequency', [
      { time: 0, value: 80 },
      { time: bars(2), value: 2000 },
    ])
    const song = metadata(layer(kickPart, filterSweep), { name: 'Cm groove' })
    expect(song).toBeInstanceOf(MetadataPattern)
    expect(song.meta.name).toBe('Cm groove')
  })
  it('uses chord with routing', () => {
    const chordProg = sequence(Chromatic.chord(N.C4, 'm', 2), Chromatic.chord(N.Ab3, '', 2))
    const padPart = chordProg.route(pad)
    expect(padPart.endBeat - padPart.startBeat).toBe(4)
  })
  it('notes aggregates all pitches unconditionally', () => {
    const kick = repeat(sequence(N.C1(1)), 4).route(drums)
    const notes = collectNotes(kick)
    expect(notes).toHaveLength(4)
    expect(notes.every((n) => pitchToMidi(n.pitch).note === 24)).toBe(true)
  })
  it('full composition matches API shape', () => {
    const kickPattern = repeat(sequence(N.C1(1)), 4)
    const snarePattern = sequence(gap(1), N.D1(1), gap(1), N.D1(1))
    const bassRiff = sequence(N.C2(0.5), gap(0.5), N.C2(0.25), gap(0.25), N.C2(0.5))
    const breakLoop = audio('break', './samples/break-140bpm.wav', 4)
    const filterSweep = automate('filter-sweep', 'bass.hp.frequency', [
      { time: 0, value: 80 },
      { time: 4, value: 2000, curve: 'linear' },
      { time: bars(2), value: 80, curve: 'exponential' },
    ])
    const verse = layer(kickPattern.route(drums), snarePattern.route(drums), bassRiff.route(bass))
    const song = repeat(verse, 8)
    const composition = metadata(layer(song, filterSweep, breakLoop), { name: 'Song' })
    expect(composition).toBeInstanceOf(MetadataPattern)
    expect(composition.meta.name).toBe('Song')
    expect(composition.endBeat - composition.startBeat).toBe(32)
  })
  it('creates sidechain automation from kick pattern', () => {
    const kickPattern = repeat(sequence(N.C1(1)), 4)
    const duck = sidechain(kickPattern, { depth: 0.8, attack: 1, release: 0.5 })
    expect(duck.length).toBeGreaterThan(0)
    const firstDuck = duck[0]!
    expect('value' in firstDuck && firstDuck.value).toBe(1)
    const bassRiff = sequence(N.C2(0.5), gap(0.5), N.C2(0.5), gap(0.5))
    const bassPart = bassRiff.route(bass)
    const duckAutomation = automate('sidechain-duck', 'bass.vol.level', duck)
    const groove = layer(bassPart, duckAutomation)
    expect(groove.endBeat - groove.startBeat).toBeGreaterThan(0)
  })
  it('creates LFO automation on filter', () => {
    const filterLfo = resolveLfo({ shape: 'sine', frequency: 2, value: 500 })
    expect(filterLfo.shape).toBe('sine')
    expect(filterLfo.value).toBe(500)
    const lfoAutomation = automate('filter-lfo', 'pad.hp.frequency', filterLfo)
    const padChords = repeat(Chromatic.chord(N.C4, 'm', 4), 4).route(pad)
    const section = layer(padChords, lfoAutomation)
    expect(section.endBeat - section.startBeat).toBe(bars(4))
  })
  it('creates formula automation', () => {
    const fadeIn = formula((t) => t, { duration: bars(2), resolution: 16 })
    expect(fadeIn.length).toBe(17)
    expect(fadeIn[0]?.value).toBeCloseTo(0)
    expect(fadeIn.at(-1)?.value).toBeCloseTo(1)
    const fadeAutomation = automate('fade-in', 'bass.vol.level', fadeIn)
    expect(fadeAutomation).toBeInstanceOf(AutomatePattern)
    expect(fadeAutomation.endBeat - fadeAutomation.startBeat).toBe(bars(2))
  })
  it('composes invert with sidechain', () => {
    const kickPattern = repeat(sequence(N.C1(1)), 4)
    const duck = sidechain(kickPattern, { depth: 0.8, attack: 1, release: 0.5 })
    const inverted = invert(duck)
    const firstDuck = duck[0]!
    const firstInverted = inverted[0]!
    expect('value' in firstDuck && firstDuck.value).toBe(1)
    expect('value' in firstInverted && firstInverted.value).toBe(0)
    for (let idx = 0; idx < duck.length; idx++) {
      const duckKf = duck[idx]!
      const invertedKf = inverted[idx]!
      if ('value' in duckKf && 'value' in invertedKf) {
        expect(duckKf.value + invertedKf.value).toBeCloseTo(1)
      }
    }
  })
  it('trigger creates pattern-driven envelope', () => {
    const kickPattern = repeat(sequence(N.C1(1)), 4)
    const envelope = trigger(kickPattern, { peak: 0.9, attack: 1, release: 0.5 })
    expect(envelope.length).toBeGreaterThan(0)
    const peaks = envelope.filter((pt) => 'value' in pt && pt.value === 0.9)
    expect(peaks).toHaveLength(4)
    const triggerAutomation = automate('trigger-env', 'drums.vol.level', envelope)
    expect(triggerAutomation).toBeInstanceOf(AutomatePattern)
  })
  it('creates env node for ADSR modulation', () => {
    const ampEnv = env({ attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3, id: 'bass.level' })
    expect(ampEnv).toBeInstanceOf(EnvelopeUnit)
    expect(ampEnv.id).toBe('bass.level')
  })
})
