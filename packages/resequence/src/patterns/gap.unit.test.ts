import { describe, expect, it } from 'vitest'
import { gap, GapPattern } from './gap'

describe('GapPattern', () => {
  describe('durationTicks', () => {
    it('resolves string duration to ticks', () => {
      expect(gap('8n').durationTicks).toBe(240)
    })

    it('resolves numeric duration as-is', () => {
      expect(gap(120).durationTicks).toBe(120)
    })
  })

  describe('transpose', () => {
    it('leaves gap unchanged', () => {
      const result = gap('4n').transpose(5) as GapPattern
      expect(result.type).toBe('gap')
      expect(result.duration).toBe('4n')
    })
  })

  describe('reverse', () => {
    it('returns gap unchanged', () => {
      const result = gap('8n').reverse() as GapPattern
      expect(result.type).toBe('gap')
      expect(result.duration).toBe('8n')
    })
  })

  describe('getNotes', () => {
    it('returns empty', () => {
      expect(gap('4n').getNotes()).toEqual([])
    })
  })
})
