import { describe, expect, it } from 'vitest'
import type { NotePattern } from './note'
import { note } from './note'
import { assign, AssignPattern } from './assign'
import { layer, LayerPattern } from './layer'
import { sequence, SequencePattern } from './sequence'

describe('AssignPattern', () => {
  describe('transpose', () => {
    it('transposes assign child and preserves metadata', () => {
      const inst = { path: './gm.sf2', bank: 0, preset: 0 }
      const result = assign(note('C4', '4n'), { track: 'bass', instrument: inst }).transpose(7) as AssignPattern
      expect(result.type).toBe('assign')
      expect(result.track).toBe('bass')
      expect(result.instrument).toEqual(inst)
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
  })

  describe('reverse', () => {
    it('reverses assign child and preserves metadata', () => {
      const inst = { path: './gm.sf2', bank: 0, preset: 0 }
      const seq = sequence(note('C4', '4n'), note('E4', '4n'))
      const result = assign(seq, { track: 'bass', instrument: inst }).reverse() as AssignPattern
      expect(result.track).toBe('bass')
      expect(result.instrument).toEqual(inst)
      const inner = result.node as SequencePattern
      expect((inner.nodes[0] as NotePattern).pitch).toBe('E4')
      expect((inner.nodes[1] as NotePattern).pitch).toBe('C4')
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
