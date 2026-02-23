import { describe, expect, it } from 'vitest'
import { resolvePitch } from './pitch'

describe('resolvePitch', () => {
  it('resolves natural notes', () => {
    expect(resolvePitch('C4')).toBe(60)
    expect(resolvePitch('D4')).toBe(62)
    expect(resolvePitch('E4')).toBe(64)
    expect(resolvePitch('F4')).toBe(65)
    expect(resolvePitch('G4')).toBe(67)
    expect(resolvePitch('A4')).toBe(69)
    expect(resolvePitch('B4')).toBe(71)
  })

  it('resolves sharps', () => {
    expect(resolvePitch('C#4')).toBe(61)
    expect(resolvePitch('F#5')).toBe(78)
    expect(resolvePitch('G#3')).toBe(56)
  })

  it('resolves flats', () => {
    expect(resolvePitch('Eb2')).toBe(39)
    expect(resolvePitch('Bb4')).toBe(70)
    expect(resolvePitch('Db3')).toBe(49)
  })

  it('resolves across octaves', () => {
    expect(resolvePitch('C0')).toBe(12)
    expect(resolvePitch('C1')).toBe(24)
    expect(resolvePitch('C2')).toBe(36)
    expect(resolvePitch('C3')).toBe(48)
    expect(resolvePitch('C5')).toBe(72)
    expect(resolvePitch('C8')).toBe(108)
  })

  it('resolves edge cases', () => {
    expect(resolvePitch('C-1')).toBe(0)
    expect(resolvePitch('G9')).toBe(127)
  })

  it('passes through MIDI note numbers', () => {
    expect(resolvePitch(60)).toBe(60)
    expect(resolvePitch(0)).toBe(0)
    expect(resolvePitch(127)).toBe(127)
  })

  it('throws on invalid pitch strings', () => {
    expect(() => resolvePitch('X4')).toThrow('Invalid pitch')
    expect(() => resolvePitch('C')).toThrow('Invalid pitch')
    expect(() => resolvePitch('C10')).toThrow('Invalid pitch')
    expect(() => resolvePitch('')).toThrow('Invalid pitch')
    expect(() => resolvePitch('c4')).toThrow('Invalid pitch')
  })
})
