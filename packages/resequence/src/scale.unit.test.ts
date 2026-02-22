import { describe, expect, it } from 'vitest'
import { scale } from './scale'

describe('scale', () => {
  describe('C major', () => {
    const c = scale('C4 major')

    it('returns all 7 degrees', () => {
      expect(c(1)).toBe('C4')
      expect(c(2)).toBe('D4')
      expect(c(3)).toBe('E4')
      expect(c(4)).toBe('F4')
      expect(c(5)).toBe('G4')
      expect(c(6)).toBe('A4')
      expect(c(7)).toBe('B4')
    })

    it('wraps up across octaves', () => {
      expect(c(8)).toBe('C5')
      expect(c(9)).toBe('D5')
      expect(c(15)).toBe('C6')
    })

    it('wraps down with negative degrees', () => {
      expect(c(-1)).toBe('B3')
      expect(c(-2)).toBe('A3')
      expect(c(-7)).toBe('C3')
    })

    it('overrides octave when specified', () => {
      expect(c(3, 5)).toBe('E5')
      expect(c(1, 2)).toBe('C2')
    })
  })

  describe('A minor', () => {
    const a = scale('A3 minor')

    it('returns natural minor degrees', () => {
      expect(a(1)).toBe('A3')
      expect(a(2)).toBe('B3')
      expect(a(3)).toBe('C3')
      expect(a(4)).toBe('D3')
      expect(a(5)).toBe('E3')
      expect(a(6)).toBe('F3')
      expect(a(7)).toBe('G3')
    })
  })

  describe('sharp and flat roots', () => {
    it('handles F# dorian', () => {
      const fs = scale('F#4 dorian')
      expect(fs(1)).toBe('F#4')
    })

    it('handles Bb mixolydian', () => {
      const bb = scale('Bb3 mixolydian')
      expect(bb(1)).toBe('Bb3')
    })
  })

  describe('pentatonic scales', () => {
    it('wraps correctly with 5-note scale', () => {
      const p = scale('C4 major pentatonic')
      expect(p(1)).toBe('C4')
      expect(p(2)).toBe('D4')
      expect(p(3)).toBe('E4')
      expect(p(4)).toBe('G4')
      expect(p(5)).toBe('A4')
      expect(p(6)).toBe('C5')
    })
  })

  describe('blues scale', () => {
    it('returns 6 degrees', () => {
      const b = scale('C4 blues')
      expect(b(1)).toBe('C4')
      expect(b(7)).toBe('C5')
    })
  })

  describe('other scale types', () => {
    it('harmonic minor', () => {
      const hm = scale('C4 harmonic minor')
      expect(hm(1)).toBe('C4')
      expect(hm(7)).toBe('B4')
    })

    it('dorian', () => {
      const d = scale('D4 dorian')
      expect(d(1)).toBe('D4')
    })

    it('lydian', () => {
      const l = scale('F4 lydian')
      expect(l(1)).toBe('F4')
      expect(l(4)).toBe('B4')
    })
  })

  describe('errors', () => {
    it('throws on invalid format', () => {
      expect(() => scale('C major')).toThrow('Invalid scale name')
    })

    it('throws on unknown scale type', () => {
      expect(() => scale('C4 notascale')).toThrow('Unknown scale')
    })
  })
})
