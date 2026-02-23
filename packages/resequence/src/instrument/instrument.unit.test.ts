import { describe, expect, it } from 'vitest'
import { ResequenceError } from '../error'
import { effects, gain, highpass, compressor } from './effect'
import { envelopes, volumeEnvelope, filterEnvelope } from './envelope'
import { instrument, kit, Instrument } from './instrument'

describe('instrument', () => {
  describe('validation', () => {
    it('rejects empty name', () => {
      expect(() => instrument('', './bass.wav', { root: 'C2' })).toThrow(ResequenceError)
      expect(() => instrument('', './bass.wav', { root: 'C2' })).toThrow('name must not be empty')
    })

    it('rejects empty zones array', () => {
      expect(() => instrument('bass', [])).toThrow(ResequenceError)
      expect(() => instrument('bass', [])).toThrow('zones array must not be empty')
    })
  })

  describe('single sample', () => {
    it('creates instrument with one zone', () => {
      const inst = instrument('bass', './bass-C2.wav', { root: 'C2' })
      expect(inst.type).toBe('instrument')
      expect(inst.name).toBe('bass')
      expect(inst.zones).toEqual([{ sample: './bass-C2.wav', root: 'C2' }])
    })

    it('stores envelopes via routeTo', () => {
      const envChain = envelopes({ amp: volumeEnvelope({ envelope: { attack: 0.3, sustain: 0.7, release: 0.8 } }) })
      const inst = instrument('pad', './pad.wav', { root: 'C3' }).routeTo(envChain)
      expect(inst.envelopes).toBe(envChain)
    })

    it('accepts loop points', () => {
      const inst = instrument('pad', './pad.wav', { root: 'C3', loopStartMs: 500, loopEndMs: 1200 })
      expect(inst.zones[0].loopStartMs).toBe(500)
      expect(inst.zones[0].loopEndMs).toBe(1200)
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

    it('accepts envelopes chain', () => {
      const inst = instrument('bass', './bass.wav', { root: 'C2' })
      const envChain = envelopes({ amp: volumeEnvelope({ envelope: {} }) })
      const routed = inst.routeTo(envChain)
      expect(routed.envelopes).toBe(envChain)
      expect(routed.effects).toBeUndefined()
    })

    it('preserves effects when adding envelopes', () => {
      const inst = instrument('bass', './bass.wav', { root: 'C2' })
      const fxChain = effects({ vol: gain({ level: -3 }) })
      const envChain = envelopes({ amp: volumeEnvelope({ envelope: {} }) })
      const routed = inst.routeTo(fxChain).routeTo(envChain)
      expect(routed.effects).toBe(fxChain)
      expect(routed.envelopes).toBe(envChain)
    })

    it('preserves envelopes when adding effects', () => {
      const inst = instrument('bass', './bass.wav', { root: 'C2' })
      const fxChain = effects({ vol: gain({ level: -3 }) })
      const envChain = envelopes({ flt: filterEnvelope({ frequency: 1000, envelope: { amount: 0.5 } }) })
      const routed = inst.routeTo(envChain).routeTo(fxChain)
      expect(routed.effects).toBe(fxChain)
      expect(routed.envelopes).toBe(envChain)
    })
  })
})

describe('kit', () => {
  describe('validation', () => {
    it('rejects empty name', () => {
      expect(() => kit('', { C1: './kick.wav' })).toThrow(ResequenceError)
      expect(() => kit('', { C1: './kick.wav' })).toThrow('name must not be empty')
    })

    it('rejects empty mapping', () => {
      expect(() => kit('drums', {})).toThrow(ResequenceError)
      expect(() => kit('drums', {})).toThrow('mapping must not be empty')
    })
  })

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

  it('supports loop points on velocity layers', () => {
    const drums = kit('drums', {
      C3: [
        { sample: './pad-soft.wav', velocity: [0, 80] as [number, number], loopStartMs: 500, loopEndMs: 1000 },
      ],
    })
    const layers = drums.mapping!.C3 as ReadonlyArray<{ sample: string; velocity: [number, number]; loopStartMs?: number; loopEndMs?: number }>
    expect(layers[0].loopStartMs).toBe(500)
    expect(layers[0].loopEndMs).toBe(1000)
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
