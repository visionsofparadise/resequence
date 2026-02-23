import { describe, expect, it } from 'vitest'
import { PPQ, bars, beats, resolveDuration } from './duration'

describe('resolveDuration', () => {
  it('resolves standard note values', () => {
    expect(resolveDuration('1n')).toBe(1920)
    expect(resolveDuration('2n')).toBe(960)
    expect(resolveDuration('4n')).toBe(480)
    expect(resolveDuration('8n')).toBe(240)
    expect(resolveDuration('16n')).toBe(120)
    expect(resolveDuration('32n')).toBe(60)
  })

  it('resolves dotted note values', () => {
    expect(resolveDuration('1n.')).toBe(2880)
    expect(resolveDuration('2n.')).toBe(1440)
    expect(resolveDuration('4n.')).toBe(720)
    expect(resolveDuration('8n.')).toBe(360)
    expect(resolveDuration('16n.')).toBe(180)
  })

  it('resolves triplet values', () => {
    expect(resolveDuration('2t')).toBe(640)
    expect(resolveDuration('4t')).toBe(320)
    expect(resolveDuration('8t')).toBe(160)
    expect(resolveDuration('16t')).toBe(80)
  })

  it('passes through numeric tick values', () => {
    expect(resolveDuration(100)).toBe(100)
    expect(resolveDuration(0)).toBe(0)
    expect(resolveDuration(1920)).toBe(1920)
  })
})

describe('bars', () => {
  it('returns ticks for n bars at 4/4', () => {
    expect(bars(1)).toBe(1920)
    expect(bars(2)).toBe(3840)
    expect(bars(4)).toBe(7680)
  })
})

describe('beats', () => {
  it('returns ticks for n beats', () => {
    expect(beats(1)).toBe(480)
    expect(beats(2)).toBe(960)
    expect(beats(4)).toBe(1920)
  })
})

describe('PPQ', () => {
  it('is 480', () => {
    expect(PPQ).toBe(480)
  })
})
