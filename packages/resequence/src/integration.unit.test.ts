import { describe, expect, it } from 'vitest'
import {
  note, gap, sequence, layer, repeat,
  instrument, kit,
  effects, gain, pan, highpass, compressor,
  envelopes, volumeEnvelope,
  sample, metadata, automate,
  bars, beats,
  chord,
  trigger, sidechain, lfo, formula, invert,
  InstrumentDefinition, RoutedPattern, SamplePattern, MetadataPattern, AutomatePattern,
} from './index'

describe('integration', () => {
  const bass = instrument('bass', './samples/bass-C2.wav', { root: 'C2' })
    .routeTo(effects({
      hp: highpass({ frequency: 80 }),
      comp: compressor({ threshold: -20, ratio: 4 }),
      vol: gain({ level: -3 }),
    }))

  const pad = instrument('pad', './samples/pad-C3.wav', { root: 'C3' })
    .routeTo(envelopes({ amp: volumeEnvelope({ envelope: { attack: 0.3, sustain: 0.7, release: 0.8 } }) }))

  const drums = kit('drums', {
    C1: './samples/kick.wav',
    D1: './samples/snare.wav',
    'F#1': './samples/hat-closed.wav',
  }).routeTo(effects({
    comp: compressor({ threshold: -15, ratio: 6 }),
    vol: gain({ level: -2 }),
    pan: pan({ value: 0 }),
  }))

  it('creates instruments with effects', () => {
    expect(bass).toBeInstanceOf(InstrumentDefinition)
    expect(bass.effects).toBeDefined()
    expect(bass.effects?.hp.type).toBe('filter')
    expect(bass.effects?.comp.type).toBe('compressor')
    expect(bass.effects?.vol.type).toBe('gain')
  })

  it('routes patterns to instruments', () => {
    const kickPattern = repeat(note('C1', '4n'), 4)
    const kickPart = kickPattern.routeTo(drums)
    expect(kickPart).toBeInstanceOf(RoutedPattern)
    expect(kickPart.instrument).toBe(drums)
    expect(kickPart.durationTicks).toBe(480 * 4)
  })

  it('composes full arrangement', () => {
    const kickPattern = repeat(note('C1', '4n'), 4)
    const snarePattern = sequence(gap('4n'), note('D1', '4n'), gap('4n'), note('D1', '4n'))
    const bassRiff = sequence(note('C2', '8n'), gap('8n'), note('C2', '16n'), gap('16n'), note('C2', '8n'))

    const kickPart = kickPattern.routeTo(drums)
    const snarePart = snarePattern.routeTo(drums)
    const bassPart = bassRiff.routeTo(bass)

    const groove = layer(kickPart, snarePart, bassPart)
    const verse = repeat(groove, 4)

    expect(groove.durationTicks).toBe(480 * 4)
    expect(verse.durationTicks).toBe(480 * 4 * 4)
  })

  it('creates named samples with effects', () => {
    const breakLoop = sample('break', './samples/break-140bpm.wav')
      .routeTo(effects({ vol: gain({ level: -6 }) }))
    expect(breakLoop).toBeInstanceOf(SamplePattern)
    expect((breakLoop as SamplePattern).effects).toBeDefined()
  })

  it('creates automation targeting effects', () => {
    const filterSweep = automate('filter-sweep', 'bass.hp.frequency', [
      { time: 0, value: 80 },
      { time: beats(4), value: 2000, curve: 'linear' },
      { time: bars(2), value: 80, curve: 'exponential' },
    ])
    expect(filterSweep).toBeInstanceOf(AutomatePattern)
    expect(filterSweep.durationTicks).toBe(bars(2))
  })

  it('creates multi-path automation', () => {
    const dualFilter = automate('dual-filter', ['bass.hp.frequency', 'pad.hp.frequency'], [
      { time: 0, value: 80 },
      { time: bars(4), value: 2000, curve: 'linear' },
    ])
    expect(dualFilter.paths).toHaveLength(2)
  })

  it('wraps with metadata', () => {
    const kickPart = repeat(note('C1', '4n'), 4).routeTo(drums)
    const filterSweep = automate('filter-sweep', 'bass.hp.frequency', [
      { time: 0, value: 80 },
      { time: bars(2), value: 2000 },
    ])
    const song = metadata(layer(kickPart, filterSweep), { tempo: 126, key: 'Cm' })
    expect(song).toBeInstanceOf(MetadataPattern)
    expect(song.tempo).toBe(126)
    expect(song.key).toBe('Cm')
  })

  it('preserves transpose through full tree', () => {
    const bassRiff = sequence(note('C2', '8n'), note('E2', '8n'))
    const bassPart = bassRiff.routeTo(bass)
    const transposed = bassPart.transpose(7)
    expect(transposed).toBeInstanceOf(RoutedPattern)
    expect(transposed.instrument).toBe(bass)
    expect(transposed.durationTicks).toBe(480)
  })

  it('preserves reverse through full tree', () => {
    const bassRiff = sequence(note('C2', '8n'), note('E2', '8n'))
    const bassPart = bassRiff.routeTo(bass)
    const reversed = bassPart.reverse()
    expect(reversed).toBeInstanceOf(RoutedPattern)
    expect(reversed.instrument).toBe(bass)
  })

  it('uses chord with routing', () => {
    const chordProg = sequence(chord('C4m', '2n'), chord('Ab3', '2n'))
    const padPart = chordProg.routeTo(pad)
    expect(padPart.durationTicks).toBe(480 * 2 * 2)
    expect(padPart.instrument).toBe(pad)
  })

  it('full composition matches API shape', () => {
    const kickPattern = repeat(note('C1', '4n'), 4)
    const snarePattern = sequence(gap('4n'), note('D1', '4n'), gap('4n'), note('D1', '4n'))
    const bassRiff = sequence(note('C2', '8n'), gap('8n'), note('C2', '16n'), gap('16n'), note('C2', '8n'))

    const kickPart = kickPattern.routeTo(drums)
    const snarePart = snarePattern.routeTo(drums)
    const bassPart = bassRiff.routeTo(bass)

    const breakLoop = sample('break', './samples/break-140bpm.wav')
      .routeTo(effects({ vol: gain({ level: -6 }) }))

    const filterSweep = automate('filter-sweep', 'bass.hp.frequency', [
      { time: 0, value: 80 },
      { time: beats(4), value: 2000, curve: 'linear' },
      { time: bars(2), value: 80, curve: 'exponential' },
    ])

    const verse = layer(kickPart, snarePart, bassPart)
    const song = repeat(verse, 8)

    const composition = metadata(layer(song, filterSweep, breakLoop), { tempo: 126, key: 'Cm' })

    expect(composition).toBeInstanceOf(MetadataPattern)
    expect(composition.tempo).toBe(126)
    expect(composition.durationTicks).toBe(480 * 4 * 8)
  })

  it('creates sidechain automation from kick pattern', () => {
    const kickPattern = repeat(note('C1', '4n'), 4)
    const duck = sidechain(kickPattern, { depth: 0.8, attack: 1, release: '8n' })

    expect(duck.length).toBeGreaterThan(0)
    expect(duck[0]?.value).toBe(1)

    const bassRiff = sequence(note('C2', '8n'), gap('8n'), note('C2', '8n'), gap('8n'))
    const bassPart = bassRiff.routeTo(bass)
    const duckAutomation = automate('sidechain-duck', 'bass.vol.level', duck)

    const groove = layer(bassPart, duckAutomation)
    expect(groove.durationTicks).toBeGreaterThan(0)
  })

  it('creates LFO automation on filter', () => {
    const filterLfo = lfo({ shape: 'sine', rate: '2n', duration: bars(4) })

    expect(filterLfo.length).toBeGreaterThan(0)
    for (const pt of filterLfo) {
      expect(pt.value).toBeGreaterThanOrEqual(0)
      expect(pt.value).toBeLessThanOrEqual(1)
    }

    const lfoAutomation = automate('filter-lfo', 'pad.hp.frequency', filterLfo)
    const padChords = repeat(chord('C4m', '1n'), 4).routeTo(pad)
    const section = layer(padChords, lfoAutomation)
    expect(section.durationTicks).toBe(bars(4))
  })

  it('creates formula automation', () => {
    const fadeIn = formula((t) => t, { duration: bars(2), resolution: 16 })

    expect(fadeIn.length).toBe(17)
    expect(fadeIn[0]?.value).toBeCloseTo(0)
    expect(fadeIn.at(-1)?.value).toBeCloseTo(1)

    const fadeAutomation = automate('fade-in', 'bass.vol.level', fadeIn)
    expect(fadeAutomation).toBeInstanceOf(AutomatePattern)
    expect(fadeAutomation.durationTicks).toBe(bars(2))
  })

  it('composes invert with sidechain', () => {
    const kickPattern = repeat(note('C1', '4n'), 4)
    const duck = sidechain(kickPattern, { depth: 0.8, attack: 1, release: '8n' })
    const inverted = invert(duck)

    expect(duck[0]?.value).toBe(1)
    expect(inverted[0]?.value).toBe(0)

    for (let idx = 0; idx < duck.length; idx++) {
      const duckValue = duck[idx]?.value ?? 0;
      const invertedValue = inverted[idx]?.value ?? 0;
      expect(duckValue + invertedValue).toBeCloseTo(1)
    }
  })

  it('trigger creates pattern-driven envelope', () => {
    const kickPattern = repeat(note('C1', '4n'), 4)
    const envelope = trigger(kickPattern, { peak: 0.9, attack: 1, release: '8n' })

    expect(envelope.length).toBeGreaterThan(0)

    const peaks = envelope.filter((pt) => pt.value === 0.9)
    expect(peaks).toHaveLength(4)

    const triggerAutomation = automate('trigger-env', 'drums.vol.level', envelope)
    expect(triggerAutomation).toBeInstanceOf(AutomatePattern)
  })
})
