import { describe, expect, it } from 'vitest'
import { PPQ, bars, ms, sec, resolveDuration } from './duration'

describe('resolveDuration', () => {
  it('resolves standard note values', () => {
    expect(resolveDuration('1n')).toBe(4)
    expect(resolveDuration('2n')).toBe(2)
    expect(resolveDuration('4n')).toBe(1)
    expect(resolveDuration('8n')).toBe(0.5)
    expect(resolveDuration('16n')).toBe(0.25)
    expect(resolveDuration('32n')).toBe(0.125)
  })

  it('resolves dotted note values', () => {
    expect(resolveDuration('1n.')).toBe(6)
    expect(resolveDuration('2n.')).toBe(3)
    expect(resolveDuration('4n.')).toBe(1.5)
    expect(resolveDuration('8n.')).toBe(0.75)
    expect(resolveDuration('16n.')).toBe(0.375)
  })

  it('resolves triplet values', () => {
    expect(resolveDuration('2t')).toBeCloseTo(4 / 3)
    expect(resolveDuration('4t')).toBeCloseTo(2 / 3)
    expect(resolveDuration('8t')).toBeCloseTo(1 / 3)
    expect(resolveDuration('16t')).toBeCloseTo(1 / 6)
  })

  it('passes through numeric beat values', () => {
    expect(resolveDuration(1)).toBe(1)
    expect(resolveDuration(0)).toBe(0)
    expect(resolveDuration(4)).toBe(4)
  })
})

describe('bars', () => {
  it('returns beats for n bars at 4/4', () => {
    expect(bars(1)).toBe(4)
    expect(bars(2)).toBe(8)
    expect(bars(4)).toBe(16)
  })

  it('respects time signature', () => {
    expect(bars(1, [7, 8])).toBe(3.5)
    expect(bars(2, [3, 4])).toBe(6)
  })
})

describe('ms', () => {
  it('converts milliseconds to beats', () => {
    expect(ms(500, 120)).toBe(1)
    expect(ms(250, 120)).toBe(0.5)
  })
})

describe('sec', () => {
  it('converts seconds to beats', () => {
    expect(sec(1, 120)).toBe(2)
  })
})

describe('PPQ', () => {
  it('is 480', () => {
    expect(PPQ).toBe(480)
  })
})
