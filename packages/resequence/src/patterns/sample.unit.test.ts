import { describe, expect, it } from 'vitest'
import { effects, gain } from '../effect'
import { sample, SamplePattern } from './sample'

describe('SamplePattern', () => {
  describe('creation', () => {
    it('creates with name and path', () => {
      const s = sample('break', './break.wav')
      expect(s.type).toBe('sample')
      expect(s.name).toBe('break')
      expect(s.path).toBe('./break.wav')
      expect(s.transposeSemitones).toBe(0)
      expect(s.reversed).toBe(false)
    })

    it('has 0 duration when no explicit duration', () => {
      const s = sample('break', './break.wav')
      expect(s.durationTicks).toBe(0)
    })

    it('resolves explicit duration', () => {
      const s = sample('break', './break.wav', '4n')
      expect(s.durationTicks).toBe(480)
    })
  })

  describe('transpose', () => {
    it('accumulates semitone offset', () => {
      const s = sample('break', './break.wav')
      const t = s.transpose(3)
      expect(t.transposeSemitones).toBe(3)
    })

    it('accumulates across multiple transposes', () => {
      const s = sample('break', './break.wav').transpose(3).transpose(4)
      expect(s.transposeSemitones).toBe(7)
    })

    it('supports negative intervals', () => {
      const s = sample('break', './break.wav').transpose(-5)
      expect(s.transposeSemitones).toBe(-5)
    })
  })

  describe('reverse', () => {
    it('toggles reversed flag', () => {
      const s = sample('break', './break.wav')
      expect(s.reverse().reversed).toBe(true)
    })

    it('double reverse cancels', () => {
      const s = sample('break', './break.wav').reverse().reverse()
      expect(s.reversed).toBe(false)
    })
  })

  describe('routeTo', () => {
    it('attaches effects chain', () => {
      const chain = effects({ vol: gain({ level: -6 }) })
      const s = sample('break', './break.wav').routeTo(chain)
      expect(s).toBeInstanceOf(SamplePattern)
      expect((s as SamplePattern).effects).toBe(chain)
    })

    it('preserves name, path, and other state', () => {
      const chain = effects({ vol: gain({ level: -6 }) })
      const s = sample('break', './break.wav', '2n').transpose(3).reverse().routeTo(chain) as SamplePattern
      expect(s.name).toBe('break')
      expect(s.path).toBe('./break.wav')
      expect(s.transposeSemitones).toBe(3)
      expect(s.reversed).toBe(true)
      expect(s.durationTicks).toBe(960)
    })
  })
})
