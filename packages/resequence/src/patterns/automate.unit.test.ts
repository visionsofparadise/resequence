import { describe, expect, it } from 'vitest'
import { bars, beats } from '../duration'
import { automate, AutomatePattern } from './automate'
import { layer } from './layer'
import { note } from './note'

describe('AutomatePattern', () => {
  describe('creation', () => {
    it('creates with name and single path', () => {
      const auto = automate('filter-sweep', 'bass.hp.frequency', [
        { time: 0, value: 80 },
        { time: beats(4), value: 2000, curve: 'linear' },
      ])
      expect(auto.type).toBe('automate')
      expect(auto.name).toBe('filter-sweep')
      expect(auto.paths).toEqual(['bass.hp.frequency'])
    })

    it('creates with multi-path', () => {
      const auto = automate('dual-filter', ['bass.hp.frequency', 'pad.hp.frequency'], [
        { time: 0, value: 80 },
        { time: bars(4), value: 2000, curve: 'linear' },
      ])
      expect(auto.paths).toEqual(['bass.hp.frequency', 'pad.hp.frequency'])
    })
  })

  describe('durationTicks', () => {
    it('derives from last envelope point', () => {
      const auto = automate('sweep', 'bass.hp.frequency', [
        { time: 0, value: 80 },
        { time: beats(4), value: 2000 },
        { time: bars(2), value: 80 },
      ])
      expect(auto.durationTicks).toBe(bars(2))
    })

    it('is 0 for empty envelope', () => {
      const auto = automate('empty', 'bass.hp.frequency', [])
      expect(auto.durationTicks).toBe(0)
    })
  })

  describe('envelope resolution', () => {
    it('resolves Duration strings to ticks', () => {
      const auto = automate('test', 'bass.vol.level', [
        { time: '4n', value: 0.5 },
      ])
      expect(auto.envelope[0].timeTicks).toBe(480)
    })

    it('resolves bars() and beats() to ticks', () => {
      const auto = automate('test', 'bass.vol.level', [
        { time: beats(2), value: 0.5 },
        { time: bars(1), value: 1.0 },
      ])
      expect(auto.envelope[0].timeTicks).toBe(960)
      expect(auto.envelope[1].timeTicks).toBe(1920)
    })

    it('passes raw tick numbers through', () => {
      const auto = automate('test', 'bass.vol.level', [
        { time: 100, value: 0.5 },
      ])
      expect(auto.envelope[0].timeTicks).toBe(100)
    })

    it('preserves curve types', () => {
      const auto = automate('test', 'bass.vol.level', [
        { time: 0, value: 0, curve: 'step' },
        { time: '4n', value: 1, curve: 'linear' },
        { time: '2n', value: 0, curve: 'exponential' },
      ])
      expect(auto.envelope[0].curve).toBe('step')
      expect(auto.envelope[1].curve).toBe('linear')
      expect(auto.envelope[2].curve).toBe('exponential')
    })
  })

  describe('path validation', () => {
    it('rejects paths with fewer than 3 segments', () => {
      expect(() => automate('bad', 'bass.hp', [{ time: 0, value: 0 }])).toThrow()
    })

    it('rejects single-segment paths', () => {
      expect(() => automate('bad', 'bass', [{ time: 0, value: 0 }])).toThrow()
    })

    it('accepts 3+ segment paths', () => {
      expect(() => automate('ok', 'bass.hp.frequency', [{ time: 0, value: 0 }])).not.toThrow()
    })
  })

  describe('transpose', () => {
    it('returns self unchanged', () => {
      const auto = automate('sweep', 'bass.hp.frequency', [
        { time: 0, value: 80 },
      ])
      expect(auto.transpose(7)).toBe(auto)
    })
  })

  describe('reverse', () => {
    it('mirrors envelope ticks around duration', () => {
      const auto = automate('sweep', 'bass.hp.frequency', [
        { time: 0, value: 80 },
        { time: bars(2), value: 2000 },
      ])
      const reversed = auto.reverse()
      expect(reversed.envelope[0].timeTicks).toBe(bars(2))
      expect(reversed.envelope[0].value).toBe(80)
      expect(reversed.envelope[1].timeTicks).toBe(0)
      expect(reversed.envelope[1].value).toBe(2000)
    })

    it('preserves duration after reverse', () => {
      const auto = automate('sweep', 'bass.hp.frequency', [
        { time: 0, value: 80 },
        { time: bars(2), value: 2000 },
      ])
      expect(auto.reverse().durationTicks).toBe(bars(2))
    })

    it('handles empty envelope', () => {
      const auto = automate('empty', 'bass.hp.frequency', [])
      const reversed = auto.reverse()
      expect(reversed.durationTicks).toBe(0)
      expect(reversed.envelope).toHaveLength(0)
    })
  })

  describe('composition', () => {
    it('composes with layer alongside musical content', () => {
      const auto = automate('sweep', 'bass.hp.frequency', [
        { time: 0, value: 80 },
        { time: '4n', value: 2000 },
      ])
      const combined = layer(note('C4', '4n'), auto)
      expect(combined.durationTicks).toBe(480)
    })
  })
})
