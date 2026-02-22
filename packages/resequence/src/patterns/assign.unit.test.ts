import { describe, expect, it } from 'vitest'
import type { EffectDefinition } from '../effect'
import type { InstrumentDefinition } from '../instrument'
import type { NotePattern } from './note'
import { note } from './note'
import { assign, AssignPattern } from './assign'
import { layer, LayerPattern } from './layer'
import { sequence, SequencePattern } from './sequence'

const inst = {} as InstrumentDefinition
const fx = [{} as EffectDefinition]

describe('AssignPattern', () => {
  describe('durationTicks', () => {
    it('delegates to child duration', () => {
      expect(assign(note('C4', '4n'), { track: 'bass' }).durationTicks).toBe(480)
    })
  })

  describe('transpose', () => {
    it('transposes assign child and preserves metadata', () => {
      const result = assign(note('C4', '4n'), { track: 'bass' }).transpose(7) as AssignPattern
      expect(result.type).toBe('assign')
      expect(result.track).toBe('bass')
      expect((result.node as NotePattern).pitch).toBe(67)
    })

    it('transposes nested structures', () => {
      const pattern = assign(
        layer(
          sequence(note('C4', '4n'), note('E4', '4n')),
          note('G4', '2n'),
        ),
        { track: 'lead' },
      )
      const result = pattern.transpose(2) as AssignPattern
      const innerLayer = result.node as LayerPattern
      const innerSeq = innerLayer.nodes[0] as SequencePattern
      expect((innerSeq.nodes[0] as NotePattern).pitch).toBe(62)
      expect((innerSeq.nodes[1] as NotePattern).pitch).toBe(66)
      expect((innerLayer.nodes[1] as NotePattern).pitch).toBe(69)
    })

    it('preserves audio, instrument, and effects through transpose', () => {
      const result = assign(note('C4', '4n'), {
        track: 'vocal',
        instrument: inst,
        audio: './vocals.wav',
        effects: fx,
      }).transpose(3) as AssignPattern
      expect(result.audio).toBe('./vocals.wav')
      expect(result.instrument).toBe(inst)
      expect(result.effects).toBe(fx)
    })
  })

  describe('reverse', () => {
    it('reverses assign child and preserves metadata', () => {
      const seq = sequence(note('C4', '4n'), note('E4', '4n'))
      const result = assign(seq, { track: 'bass' }).reverse() as AssignPattern
      expect(result.track).toBe('bass')
      const inner = result.node as SequencePattern
      expect((inner.nodes[0] as NotePattern).pitch).toBe('E4')
      expect((inner.nodes[1] as NotePattern).pitch).toBe('C4')
    })

    it('preserves audio, instrument, and effects through reverse', () => {
      const seq = sequence(note('C4', '4n'), note('E4', '4n'))
      const result = assign(seq, {
        track: 'vocal',
        instrument: inst,
        audio: './vocals.wav',
        effects: fx,
      }).reverse() as AssignPattern
      expect(result.audio).toBe('./vocals.wav')
      expect(result.instrument).toBe(inst)
      expect(result.effects).toBe(fx)
    })

    it('preserves all note metadata through reverse', () => {
      const nn = note('C4', '2n', { velocity: 50, lyric: 'lo' })
      const result = sequence(nn, note('D4', '4n')).reverse() as SequencePattern
      const reversed = result.nodes[1] as NotePattern
      expect(reversed.pitch).toBe('C4')
      expect(reversed.duration).toBe('2n')
      expect(reversed.velocity).toBe(50)
      expect(reversed.lyric).toBe('lo')
    })
  })
})
