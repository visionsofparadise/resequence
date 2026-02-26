import { describe, expect, it } from 'vitest'
import {
  note, gap, sequence, layer, repeat,
  sampler, SamplerUnit,
  gain, pan, highpass, compressor,
  env, EnvelopeUnit,
  audio, metadata, automate,
  bars,
  N, Chromatic,
  trigger, sidechain, formula, invert, resolveLfo,
  pitchToMidi,
  MetadataPattern, AutomatePattern, AudioPattern,
} from './index'

describe('integration', () => {
  const bass = sampler('./samples/bass-C2.wav', { root: 'C2', id: 'bass' })
  const pad = sampler('./samples/pad-C3.wav', { root: 'C3', id: 'pad' })
  const drums = sampler({
    C1: './samples/kick.wav',
    D1: './samples/snare.wav',
    'F#1': './samples/hat-closed.wav',
  }, { id: 'drums' })

  it('creates samplers', () => {
    expect(bass).toBeInstanceOf(SamplerUnit)
    expect(bass.id).toBe('bass')
    expect(drums).toBeInstanceOf(SamplerUnit)
    expect(drums.id).toBe('drums')
  })

  it('chains effects on instrument via .to()', () => {
    const inst = sampler('./samples/bass-C2.wav', { root: 'C2', id: 'test-inst' })
    const hp = highpass({ frequency: 80 })
    const comp = compressor({ threshold: -20, ratio: 4 })
    const g = gain({ level: -3 })
    inst.to(hp).to(comp).to(g)
    expect(inst.targets).toHaveLength(1)
    expect(inst.targets[0]).toBe(hp)
  })

  it('routes pattern to instrument with .route()', () => {
    const kickPattern = repeat(note('C1', '4n'), 4)
    const kickPart = kickPattern.route(drums)
    expect(kickPart.durationBeats).toBe(4)
  })

  it('composes full arrangement', () => {
    const kickPattern = repeat(note('C1', '4n'), 4)
    const snarePattern = sequence(gap('4n'), note('D1', '4n'), gap('4n'), note('D1', '4n'))
    const bassRiff = sequence(note('C2', '8n'), gap('8n'), note('C2', '16n'), gap('16n'), note('C2', '8n'))

    const groove = layer(kickPattern.route(drums), snarePattern.route(drums), bassRiff.route(bass))
    const verse = repeat(groove, 4)

    expect(groove.durationBeats).toBe(4)
    expect(verse.durationBeats).toBe(16)
  })

  it('creates named audio patterns', () => {
    const breakLoop = audio('break', './samples/break-140bpm.wav')
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
    expect(filterSweep.durationBeats).toBe(bars(2))
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
    const kickPart = repeat(note('C1', '4n'), 4).route(drums)
    const filterSweep = automate('filter-sweep', 'bass.hp.frequency', [
      { time: 0, value: 80 },
      { time: bars(2), value: 2000 },
    ])
    const song = metadata(layer(kickPart, filterSweep), { name: 'Cm groove' })
    expect(song).toBeInstanceOf(MetadataPattern)
    expect(song.meta.name).toBe('Cm groove')
  })

  it('uses chord with routing', () => {
    const chordProg = sequence(Chromatic.chord(N['C4']!.pitch, 'm', '2n'), Chromatic.chord(N['Ab3']!.pitch, '', '2n'))
    const padPart = chordProg.route(pad)
    expect(padPart.durationBeats).toBe(4)
  })

  it('notes aggregates all pitches unconditionally', () => {
    const kick = repeat(note('C1', '4n'), 4).route(drums)
    expect(kick.notes).toHaveLength(4)
    expect(kick.notes.every((n) => pitchToMidi(n.pitch).note === 24)).toBe(true)
  })

  it('full composition matches API shape', () => {
    const kickPattern = repeat(note('C1', '4n'), 4)
    const snarePattern = sequence(gap('4n'), note('D1', '4n'), gap('4n'), note('D1', '4n'))
    const bassRiff = sequence(note('C2', '8n'), gap('8n'), note('C2', '16n'), gap('16n'), note('C2', '8n'))

    const breakLoop = audio('break', './samples/break-140bpm.wav')
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
    expect(composition.durationBeats).toBe(32)
  })

  it('creates sidechain automation from kick pattern', () => {
    const kickPattern = repeat(note('C1', '4n'), 4)
    const duck = sidechain(kickPattern, { depth: 0.8, attack: 1, release: '8n' })

    expect(duck.length).toBeGreaterThan(0)
    const firstDuck = duck[0]!
    expect('value' in firstDuck && firstDuck.value).toBe(1)

    const bassRiff = sequence(note('C2', '8n'), gap('8n'), note('C2', '8n'), gap('8n'))
    const bassPart = bassRiff.route(bass)
    const duckAutomation = automate('sidechain-duck', 'bass.vol.level', duck)

    const groove = layer(bassPart, duckAutomation)
    expect(groove.durationBeats).toBeGreaterThan(0)
  })

  it('creates LFO automation on filter', () => {
    const filterLfo = resolveLfo({ shape: 'sine', frequency: 2, value: 500 })

    expect(filterLfo.shape).toBe('sine')
    expect(filterLfo.value).toBe(500)

    const lfoAutomation = automate('filter-lfo', 'pad.hp.frequency', filterLfo)
    const padChords = repeat(Chromatic.chord(N['C4']!.pitch, 'm', '1n'), 4).route(pad)
    const section = layer(padChords, lfoAutomation)
    expect(section.durationBeats).toBe(bars(4))
  })

  it('creates formula automation', () => {
    const fadeIn = formula((t) => t, { duration: bars(2), resolution: 16 })

    expect(fadeIn.length).toBe(17)
    expect(fadeIn[0]?.value).toBeCloseTo(0)
    expect(fadeIn.at(-1)?.value).toBeCloseTo(1)

    const fadeAutomation = automate('fade-in', 'bass.vol.level', fadeIn)
    expect(fadeAutomation).toBeInstanceOf(AutomatePattern)
    expect(fadeAutomation.durationBeats).toBe(bars(2))
  })

  it('composes invert with sidechain', () => {
    const kickPattern = repeat(note('C1', '4n'), 4)
    const duck = sidechain(kickPattern, { depth: 0.8, attack: 1, release: '8n' })
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
    const kickPattern = repeat(note('C1', '4n'), 4)
    const envelope = trigger(kickPattern, { peak: 0.9, attack: 1, release: '8n' })

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
