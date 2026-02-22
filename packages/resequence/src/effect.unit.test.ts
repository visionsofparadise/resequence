import { describe, expect, it } from 'vitest'
import { gain, pan, filter, highpass, lowpass, compressor, delay, reverb, effects } from './effect'

describe('gain', () => {
  it('returns GainEffect with correct type and level', () => {
    const fx = gain({ level: -3 })
    expect(fx).toEqual({ type: 'gain', level: -3 })
  })
})

describe('pan', () => {
  it('returns PanEffect with correct type and value', () => {
    const fx = pan({ value: 0.5 })
    expect(fx).toEqual({ type: 'pan', value: 0.5 })
  })
})

describe('filter', () => {
  it('returns FilterEffect with mode and frequency', () => {
    const fx = filter({ mode: 'bandpass', frequency: 1000 })
    expect(fx).toEqual({ type: 'filter', mode: 'bandpass', frequency: 1000, resonance: undefined })
  })

  it('includes resonance when provided', () => {
    const fx = filter({ mode: 'peaking', frequency: 2000, resonance: 5 })
    expect(fx).toEqual({ type: 'filter', mode: 'peaking', frequency: 2000, resonance: 5 })
  })
})

describe('highpass', () => {
  it('returns FilterEffect with highpass mode', () => {
    const fx = highpass({ frequency: 80 })
    expect(fx.type).toBe('filter')
    expect(fx.mode).toBe('highpass')
    expect(fx.frequency).toBe(80)
  })

  it('passes resonance through', () => {
    const fx = highpass({ frequency: 200, resonance: 2 })
    expect(fx.resonance).toBe(2)
  })
})

describe('lowpass', () => {
  it('returns FilterEffect with lowpass mode', () => {
    const fx = lowpass({ frequency: 5000 })
    expect(fx.type).toBe('filter')
    expect(fx.mode).toBe('lowpass')
    expect(fx.frequency).toBe(5000)
  })
})

describe('compressor', () => {
  it('returns CompressorEffect with required params', () => {
    const fx = compressor({ threshold: -20, ratio: 4 })
    expect(fx).toEqual({ type: 'compressor', threshold: -20, ratio: 4, attack: undefined, release: undefined })
  })

  it('includes optional attack and release', () => {
    const fx = compressor({ threshold: -15, ratio: 6, attack: 0.003, release: 0.25 })
    expect(fx.attack).toBe(0.003)
    expect(fx.release).toBe(0.25)
  })
})

describe('delay', () => {
  it('returns DelayEffect with time', () => {
    const fx = delay({ time: 0.5 })
    expect(fx).toEqual({ type: 'delay', time: 0.5, feedback: undefined })
  })

  it('includes feedback when provided', () => {
    const fx = delay({ time: 0.25, feedback: 0.4 })
    expect(fx.feedback).toBe(0.4)
  })
})

describe('reverb', () => {
  it('returns ReverbEffect with impulse path', () => {
    const fx = reverb({ impulse: './ir/hall.wav' })
    expect(fx).toEqual({ type: 'reverb', impulse: './ir/hall.wav' })
  })
})

describe('effects', () => {
  it('returns a frozen keyed map', () => {
    const chain = effects({
      hp: highpass({ frequency: 80 }),
      vol: gain({ level: -3 }),
    })
    expect(chain.hp.type).toBe('filter')
    expect(chain.vol.type).toBe('gain')
    expect(Object.isFrozen(chain)).toBe(true)
  })

  it('preserves key insertion order', () => {
    const chain = effects({
      hp: highpass({ frequency: 80 }),
      comp: compressor({ threshold: -20, ratio: 4 }),
      vol: gain({ level: -3 }),
    })
    expect(Object.keys(chain)).toEqual(['hp', 'comp', 'vol'])
  })
})
