import { describe, expect, it } from 'vitest'
import type { NotePattern } from './note'
import { note } from './note'
import { layer, LayerPattern } from './layer'
import { sequence, SequencePattern } from './sequence'

describe('LayerPattern', () => {
  describe('transpose', () => {
    it('transposes layer children', () => {
      const result = layer(note('C4', '4n'), note('E4', '4n')).transpose(7) as LayerPattern
      expect(result.type).toBe('layer')
      expect((result.nodes[0] as NotePattern).pitch).toBe(67)
      expect((result.nodes[1] as NotePattern).pitch).toBe(71)
    })
  })

  describe('reverse', () => {
    it('reverses each layer child individually', () => {
      const seq1 = sequence(note('C4', '4n'), note('D4', '4n'))
      const seq2 = sequence(note('E4', '4n'), note('F4', '4n'))
      const result = layer(seq1, seq2).reverse() as LayerPattern
      const reversed1 = result.nodes[0] as SequencePattern
      const reversed2 = result.nodes[1] as SequencePattern
      expect((reversed1.nodes[0] as NotePattern).pitch).toBe('D4')
      expect((reversed1.nodes[1] as NotePattern).pitch).toBe('C4')
      expect((reversed2.nodes[0] as NotePattern).pitch).toBe('F4')
      expect((reversed2.nodes[1] as NotePattern).pitch).toBe('E4')
    })
  })
})
