import { describe, expect, it } from 'vitest'
import { note } from './note'
import { sequence } from './sequence'
import { metadata, MetadataPattern } from './metadata'
import type { NotePattern } from './note'
import type { SequencePattern } from './sequence'

describe('MetadataPattern', () => {
  describe('creation', () => {
    it('wraps pattern with all metadata fields', () => {
      const m = metadata(note('C4', '4n'), { tempo: 126, key: 'Cm', timeSignature: [4, 4] })
      expect(m.type).toBe('metadata')
      expect(m.tempo).toBe(126)
      expect(m.key).toBe('Cm')
      expect(m.timeSignature).toEqual([4, 4])
    })

    it('supports partial metadata', () => {
      const m = metadata(note('C4', '4n'), { tempo: 140 })
      expect(m.tempo).toBe(140)
      expect(m.key).toBeUndefined()
      expect(m.timeSignature).toBeUndefined()
    })
  })

  describe('durationTicks', () => {
    it('delegates to child', () => {
      const m = metadata(note('C4', '4n'), { tempo: 120 })
      expect(m.durationTicks).toBe(480)
    })

    it('delegates sequence duration', () => {
      const m = metadata(sequence(note('C4', '4n'), note('E4', '4n')), { tempo: 120 })
      expect(m.durationTicks).toBe(960)
    })
  })

  describe('transpose', () => {
    it('transposes child, preserves metadata', () => {
      const m = metadata(note('C4', '4n'), { tempo: 126, key: 'Cm' })
      const transposed = m.transpose(7)
      expect(transposed).toBeInstanceOf(MetadataPattern)
      expect(transposed.tempo).toBe(126)
      expect(transposed.key).toBe('Cm')
      expect((transposed.node as NotePattern).pitch).toBe(67)
    })
  })

  describe('reverse', () => {
    it('reverses child, preserves metadata', () => {
      const m = metadata(
        sequence(note('C4', '4n'), note('E4', '4n')),
        { tempo: 126 },
      )
      const reversed = m.reverse()
      expect(reversed).toBeInstanceOf(MetadataPattern)
      expect(reversed.tempo).toBe(126)
      const inner = reversed.node as SequencePattern
      expect((inner.nodes[0] as NotePattern).pitch).toBe('E4')
      expect((inner.nodes[1] as NotePattern).pitch).toBe('C4')
    })
  })
})
