import { describe, expect, it } from 'vitest'
import type { NotePattern } from './note'
import { note } from './note'
import { repeat, RepeatPattern } from './repeat'
import { sequence, SequencePattern } from './sequence'

describe('RepeatPattern', () => {
  describe('durationTicks', () => {
    it('multiplies child duration by count', () => {
      expect(repeat(note('C4', '4n'), 4).durationTicks).toBe(1920)
    })
  })

  describe('transpose', () => {
    it('transposes repeat child', () => {
      const result = repeat(note('C4', '4n'), 4).transpose(5) as RepeatPattern
      expect(result.type).toBe('repeat')
      expect(result.count).toBe(4)
      expect((result.node as NotePattern).pitch).toBe(65)
    })
  })

  describe('reverse', () => {
    it('reverses repeat child', () => {
      const seq = sequence(note('C4', '4n'), note('E4', '4n'))
      const result = repeat(seq, 4).reverse() as RepeatPattern
      expect(result.count).toBe(4)
      const inner = result.node as SequencePattern
      expect((inner.nodes[0] as NotePattern).pitch).toBe('E4')
      expect((inner.nodes[1] as NotePattern).pitch).toBe('C4')
    })
  })
})
