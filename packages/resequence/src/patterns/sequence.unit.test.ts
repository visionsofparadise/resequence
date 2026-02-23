import { describe, expect, it } from 'vitest'
import { gap } from './gap'
import type { NotePattern } from './note'
import { note } from './note'
import { sequence, SequencePattern } from './sequence'

describe('SequencePattern', () => {
  describe('durationTicks', () => {
    it('sums child durations', () => {
      expect(sequence(note('C4', '4n'), note('E4', '8n')).durationTicks).toBe(720)
    })

    it('returns 0 for empty sequence', () => {
      expect(sequence().durationTicks).toBe(0)
    })
  })

  describe('transpose', () => {
    it('transposes sequence children', () => {
      const result = sequence(note('C4', '4n'), note('E4', '4n')).transpose(3) as SequencePattern
      expect(result.type).toBe('sequence')
      expect((result.nodes[0] as NotePattern).pitch).toBe(63)
      expect((result.nodes[1] as NotePattern).pitch).toBe(67)
    })
  })

  describe('reverse', () => {
    it('reverses sequence children', () => {
      const result = sequence(note('C4', '4n'), note('E4', '4n'), note('G4', '4n')).reverse() as SequencePattern
      expect(result.type).toBe('sequence')
      expect((result.nodes[0] as NotePattern).pitch).toBe('G4')
      expect((result.nodes[1] as NotePattern).pitch).toBe('E4')
      expect((result.nodes[2] as NotePattern).pitch).toBe('C4')
    })

    it('recursively reverses nested sequences', () => {
      const inner = sequence(note('C4', '4n'), note('D4', '4n'))
      const outer = sequence(note('E4', '4n'), inner)
      const result = outer.reverse() as SequencePattern
      const reversedInner = result.nodes[0] as SequencePattern
      expect((reversedInner.nodes[0] as NotePattern).pitch).toBe('D4')
      expect((reversedInner.nodes[1] as NotePattern).pitch).toBe('C4')
      expect((result.nodes[1] as NotePattern).pitch).toBe('E4')
    })
  })

  describe('getNotes', () => {
    it('accumulates offsets', () => {
      const pat = sequence(note('C4', '4n'), note('D4', '4n'), note('E4', '4n'))
      expect(pat.getNotes()).toEqual([
        { tick: 0, pitch: 60 },
        { tick: 480, pitch: 62 },
        { tick: 960, pitch: 64 },
      ])
    })

    it('skips gaps', () => {
      const pat = sequence(note('C4', '4n'), gap('4n'), note('E4', '4n'))
      expect(pat.getNotes()).toEqual([
        { tick: 0, pitch: 60 },
        { tick: 960, pitch: 64 },
      ])
    })

    it('returns empty for empty sequence', () => {
      expect(sequence().getNotes()).toEqual([])
    })
  })
})
