import { describe, expect, it } from 'vitest'
import { effects, gain, highpass, compressor } from './effect'
import { instrument, kit, Instrument } from './instrument'

describe('instrument', () => {
  describe('single sample', () => {
    it('creates instrument with one zone', () => {
      const inst = instrument('bass', './bass-C2.wav', { root: 'C2' })
      expect(inst.type).toBe('instrument')
      expect(inst.name).toBe('bass')
      expect(inst.zones).toEqual([{ sample: './bass-C2.wav', root: 'C2' }])
    })

    it('stores envelope', () => {
      const inst = instrument('pad', './pad.wav', {
        root: 'C3',
        envelope: { attack: 0.3, sustain: 0.7, release: 0.8 },
      })
      expect(inst.envelope).toEqual({ attack: 0.3, sustain: 0.7, release: 0.8 })
    })
  })

  describe('multi-sample zones', () => {
    it('creates instrument with multiple zones', () => {
      const inst = instrument('piano', [
        { sample: './piano-C2.wav', root: 'C2' },
        { sample: './piano-C4.wav', root: 'C4' },
      ])
      expect(inst.type).toBe('instrument')
      expect(inst.zones).toHaveLength(2)
      expect(inst.zones[0].root).toBe('C2')
      expect(inst.zones[1].root).toBe('C4')
    })

    it('supports velocity layers', () => {
      const inst = instrument('piano', [
        { sample: './piano-C2-soft.wav', root: 'C2', velocity: [0, 80] },
        { sample: './piano-C2-hard.wav', root: 'C2', velocity: [81, 127] },
      ])
      expect(inst.zones[0].velocity).toEqual([0, 80])
      expect(inst.zones[1].velocity).toEqual([81, 127])
    })
  })

  describe('routeTo', () => {
    it('returns new instance with effects attached', () => {
      const inst = instrument('bass', './bass.wav', { root: 'C2' })
      const chain = effects({ vol: gain({ level: -3 }) })
      const routed = inst.routeTo(chain)
      expect(routed.effects).toBe(chain)
      expect(routed.name).toBe('bass')
    })

    it('preserves original instrument unchanged', () => {
      const inst = instrument('bass', './bass.wav', { root: 'C2' })
      const chain = effects({ vol: gain({ level: -3 }) })
      inst.routeTo(chain)
      expect(inst.effects).toBeUndefined()
    })

    it('returns Instrument', () => {
      const inst = instrument('bass', './bass.wav', { root: 'C2' })
      const routed = inst.routeTo(effects({ vol: gain({ level: -3 }) }))
      expect(routed).toBeInstanceOf(Instrument)
    })
  })
})

describe('kit', () => {
  it('creates kit with string mapping', () => {
    const drums = kit('drums', {
      C1: './kick.wav',
      D1: './snare.wav',
      'F#1': './hat.wav',
    })
    expect(drums.type).toBe('kit')
    expect(drums.name).toBe('drums')
    expect(drums.mapping).toEqual({
      C1: './kick.wav',
      D1: './snare.wav',
      'F#1': './hat.wav',
    })
  })

  it('supports velocity layers in mapping', () => {
    const drums = kit('drums', {
      C1: [
        { sample: './kick-soft.wav', velocity: [0, 80] as [number, number] },
        { sample: './kick-hard.wav', velocity: [81, 127] as [number, number] },
      ],
      D1: './snare.wav',
    })
    expect(Array.isArray(drums.mapping!.C1)).toBe(true)
    expect(typeof drums.mapping!.D1).toBe('string')
  })

  it('supports routeTo for effects', () => {
    const drums = kit('drums', { C1: './kick.wav' })
    const chain = effects({
      comp: compressor({ threshold: -15, ratio: 6 }),
      vol: gain({ level: -2 }),
    })
    const routed = drums.routeTo(chain)
    expect(routed.effects).toBe(chain)
    expect(routed.mapping).toEqual({ C1: './kick.wav' })
  })
})
