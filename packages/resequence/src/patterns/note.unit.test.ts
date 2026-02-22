import { describe, expect, it } from 'vitest'
import { note, NotePattern } from './note'

describe('NotePattern', () => {
  describe('durationTicks', () => {
    it('resolves string duration to ticks', () => {
      expect(note('C4', '4n').durationTicks).toBe(480)
    })

    it('resolves numeric duration as-is', () => {
      expect(note('C4', 240).durationTicks).toBe(240)
    })

    it('resolves dotted duration', () => {
      expect(note('C4', '4n.').durationTicks).toBe(720)
    })
  })

  describe('transpose', () => {
    it('transposes a single note up', () => {
      const result = note('C4', '4n').transpose(7) as NotePattern
      expect(result.type).toBe('note')
      expect(result.pitch).toBe(67)
    })

    it('transposes a single note down', () => {
      const result = note('C4', '4n').transpose(-12) as NotePattern
      expect(result.pitch).toBe(48)
    })

    it('transposes numeric pitch', () => {
      const result = note(60, '4n').transpose(5) as NotePattern
      expect(result.pitch).toBe(65)
    })

    it('preserves velocity', () => {
      const result = note('C4', '4n', { velocity: 80 }).transpose(3) as NotePattern
      expect(result.velocity).toBe(80)
    })

    it('preserves lyric', () => {
      const result = note('C4', '4n', { lyric: 'hel' }).transpose(3) as NotePattern
      expect(result.lyric).toBe('hel')
    })

    it('preserves duration', () => {
      const result = note('C4', '2n').transpose(3) as NotePattern
      expect(result.duration).toBe('2n')
    })

    it('handles negative intervals', () => {
      const result = note('C4', '4n').transpose(-3) as NotePattern
      expect(result.pitch).toBe(57)
    })

    it('handles zero interval', () => {
      const result = note('C4', '4n').transpose(0) as NotePattern
      expect(result.pitch).toBe(60)
    })
  })

  describe('reverse', () => {
    it('returns note unchanged', () => {
      const result = note('C4', '4n', { velocity: 80, lyric: 'hel' }).reverse() as NotePattern
      expect(result.type).toBe('note')
      expect(result.pitch).toBe('C4')
      expect(result.duration).toBe('4n')
      expect(result.velocity).toBe(80)
      expect(result.lyric).toBe('hel')
    })
  })
})
