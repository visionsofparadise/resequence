import { describe, expect, it } from 'vitest'
import { chord } from './chord'
import type { NoteNode } from './pattern'

function pitches(result: ReturnType<typeof chord>): ReadonlyArray<number | string> {
  return result.nodes.map((n) => (n as NoteNode).pitch)
}

describe('chord', () => {
  describe('string input', () => {
    it('parses major triad', () => {
      expect(pitches(chord('C4', '4n'))).toEqual([60, 64, 67])
    })

    it('parses major triad from G', () => {
      expect(pitches(chord('G3', '4n'))).toEqual([55, 59, 62])
    })

    it('parses minor triad', () => {
      expect(pitches(chord('C4m', '2n'))).toEqual([60, 63, 67])
    })

    it('parses minor triad with sharp root', () => {
      expect(pitches(chord('F#3m', '4n'))).toEqual([54, 57, 61])
    })

    it('parses dominant seventh', () => {
      expect(pitches(chord('C47', '4n'))).toEqual([60, 64, 67, 70])
    })

    it('parses major seventh', () => {
      expect(pitches(chord('C4maj7', '2n'))).toEqual([60, 64, 67, 71])
    })

    it('parses minor seventh', () => {
      expect(pitches(chord('A3m7', '1n'))).toEqual([57, 60, 64, 67])
    })

    it('parses minor seventh with sharp root', () => {
      expect(pitches(chord('F#3m7', '4n'))).toEqual([54, 57, 61, 64])
    })

    it('parses diminished', () => {
      expect(pitches(chord('C4dim', '4n'))).toEqual([60, 63, 66])
    })

    it('parses augmented', () => {
      expect(pitches(chord('C4aug', '4n'))).toEqual([60, 64, 68])
    })

    it('parses sus4', () => {
      expect(pitches(chord('C4sus4', '4n'))).toEqual([60, 65, 67])
    })

    it('parses sus2', () => {
      expect(pitches(chord('C4sus2', '4n'))).toEqual([60, 62, 67])
    })

    it('applies duration to all notes', () => {
      const result = chord('C4', '2n')
      for (const n of result.nodes) {
        expect((n as NoteNode).duration).toBe('2n')
      }
    })

    it('wraps notes above root into correct octave', () => {
      const result = chord('A3m7', '1n')
      expect(pitches(result)).toEqual([57, 60, 64, 67])
    })

    it('parses flat root', () => {
      const result = chord('Bb3', '4n')
      expect(pitches(result)).toEqual([58, 62, 65])
    })

    it('throws on invalid chord name', () => {
      expect(() => chord('X4', '4n')).toThrow('Invalid chord name')
    })

    it('throws on missing octave', () => {
      expect(() => chord('Cmaj7', '4n')).toThrow('Invalid chord name')
    })

    it('throws on unknown quality', () => {
      expect(() => chord('C4xyz', '4n')).toThrow('Unknown chord quality')
    })
  })

  describe('array input', () => {
    it('builds layer from pitch array', () => {
      expect(pitches(chord(['C4', 'E4', 'G4'], '2n'))).toEqual(['C4', 'E4', 'G4'])
    })

    it('preserves custom voicing (first inversion)', () => {
      expect(pitches(chord(['E3', 'G3', 'C4'], '4n'))).toEqual(['E3', 'G3', 'C4'])
    })

    it('applies duration to all notes', () => {
      const result = chord(['C4', 'E4'], '8n')
      for (const n of result.nodes) {
        expect((n as NoteNode).duration).toBe('8n')
      }
    })

    it('throws on empty array', () => {
      expect(() => chord([], '4n')).toThrow('chord() requires at least one pitch')
    })
  })
})
