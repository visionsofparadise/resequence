import { N } from '../tunings/chromatic'
import { describe, expect, it } from 'vitest'
import { addSteps, pitchKey, pitchToCents, pitchToMidi } from './pitch'

describe('pitchToMidi', () => {
	it('returns MIDI note number for 12-EDO pitches', () => {
		expect(pitchToMidi(N.C4).note).toBe(60)
		expect(pitchToMidi(N.A4).note).toBe(69)
		expect(pitchToMidi(N.G9).note).toBe(127)
	})

	it('returns zero bend for 12-EDO standard pitches', () => {
		expect(pitchToMidi(N.C4).bend).toBe(0)
		expect(pitchToMidi(N.Fs3).bend).toBe(0)
	})

	it('returns non-zero bend for microtonal pitches', () => {
		const quarterTone = { class: 1, stepsPerOctave: 24, octave: 4, octaveRatio: 2 }
		const { note, bend } = pitchToMidi(quarterTone)
		expect(note).toBe(61)
		expect(Math.abs(bend)).toBeGreaterThan(0)
	})
})

describe('pitchKey', () => {
	it('returns octave * stepsPerOctave + class', () => {
		expect(pitchKey(N.C4)).toBe(4 * 12 + 0)
		expect(pitchKey(N.E4)).toBe(4 * 12 + 4)
		expect(pitchKey(N.C5)).toBe(5 * 12 + 0)
	})

})

describe('addSteps', () => {
	it('transposes up by semitones', () => {
		expect(addSteps(N.C4, 7)).toEqual({ class: 7, stepsPerOctave: 12, octave: 4, octaveRatio: 2 })
		expect(addSteps(N.C4, 12)).toEqual({ class: 0, stepsPerOctave: 12, octave: 5, octaveRatio: 2 })
	})

	it('transposes down by semitones', () => {
		expect(addSteps(N.C4, -12)).toEqual({ class: 0, stepsPerOctave: 12, octave: 3, octaveRatio: 2 })
		expect(addSteps(N.G4, -7)).toEqual({ class: 0, stepsPerOctave: 12, octave: 4, octaveRatio: 2 })
	})

	it('carries octave correctly', () => {
		expect(addSteps(N.B4, 1)).toEqual({ class: 0, stepsPerOctave: 12, octave: 5, octaveRatio: 2 })
		expect(addSteps(N.C5, -1)).toEqual({ class: 11, stepsPerOctave: 12, octave: 4, octaveRatio: 2 })
	})

})

describe('pitchToCents', () => {
	it('returns 0 for same pitch', () => {
		expect(pitchToCents(N.C4, N.C4)).toBe(0)
	})

	it('returns 1200 for an octave up', () => {
		expect(pitchToCents(N.C4, N.C5)).toBeCloseTo(1200)
	})

})
