import { describe, expect, it } from 'vitest'
import { addSteps, pitchKey, pitchToCents, pitchToMidi, resolvePitch } from './pitch'

describe('resolvePitch', () => {
	it('resolves natural notes', () => {
		expect(resolvePitch('C4')).toEqual({ class: 0, stepsPerOctave: 12, octave: 4, octaveRatio: 2 })
		expect(resolvePitch('D4')).toEqual({ class: 2, stepsPerOctave: 12, octave: 4, octaveRatio: 2 })
		expect(resolvePitch('E4')).toEqual({ class: 4, stepsPerOctave: 12, octave: 4, octaveRatio: 2 })
		expect(resolvePitch('F4')).toEqual({ class: 5, stepsPerOctave: 12, octave: 4, octaveRatio: 2 })
		expect(resolvePitch('G4')).toEqual({ class: 7, stepsPerOctave: 12, octave: 4, octaveRatio: 2 })
		expect(resolvePitch('A4')).toEqual({ class: 9, stepsPerOctave: 12, octave: 4, octaveRatio: 2 })
		expect(resolvePitch('B4')).toEqual({ class: 11, stepsPerOctave: 12, octave: 4, octaveRatio: 2 })
	})

	it('resolves sharps', () => {
		expect(resolvePitch('C#4')).toEqual({ class: 1, stepsPerOctave: 12, octave: 4, octaveRatio: 2 })
		expect(resolvePitch('F#5')).toEqual({ class: 6, stepsPerOctave: 12, octave: 5, octaveRatio: 2 })
		expect(resolvePitch('G#3')).toEqual({ class: 8, stepsPerOctave: 12, octave: 3, octaveRatio: 2 })
	})

	it('resolves flats', () => {
		expect(resolvePitch('Eb2')).toEqual({ class: 3, stepsPerOctave: 12, octave: 2, octaveRatio: 2 })
		expect(resolvePitch('Bb4')).toEqual({ class: 10, stepsPerOctave: 12, octave: 4, octaveRatio: 2 })
		expect(resolvePitch('Db3')).toEqual({ class: 1, stepsPerOctave: 12, octave: 3, octaveRatio: 2 })
	})

	it('resolves across octaves', () => {
		expect(resolvePitch('C0')).toEqual({ class: 0, stepsPerOctave: 12, octave: 0, octaveRatio: 2 })
		expect(resolvePitch('C1')).toEqual({ class: 0, stepsPerOctave: 12, octave: 1, octaveRatio: 2 })
		expect(resolvePitch('C5')).toEqual({ class: 0, stepsPerOctave: 12, octave: 5, octaveRatio: 2 })
		expect(resolvePitch('C8')).toEqual({ class: 0, stepsPerOctave: 12, octave: 8, octaveRatio: 2 })
	})

	it('resolves edge cases', () => {
		expect(resolvePitch('C-1')).toEqual({ class: 0, stepsPerOctave: 12, octave: -1, octaveRatio: 2 })
		expect(resolvePitch('G9')).toEqual({ class: 7, stepsPerOctave: 12, octave: 9, octaveRatio: 2 })
	})

	it('resolves MIDI integers', () => {
		expect(resolvePitch(60)).toEqual({ class: 0, stepsPerOctave: 12, octave: 4, octaveRatio: 2 })
		expect(resolvePitch(0)).toEqual({ class: 0, stepsPerOctave: 12, octave: -1, octaveRatio: 2 })
		expect(resolvePitch(127)).toEqual({ class: 7, stepsPerOctave: 12, octave: 9, octaveRatio: 2 })
		expect(resolvePitch(69)).toEqual({ class: 9, stepsPerOctave: 12, octave: 4, octaveRatio: 2 })
	})

	it('passes through existing Pitch structs unchanged', () => {
		const pitch = { class: 4, stepsPerOctave: 12, octave: 4, octaveRatio: 2 }
		expect(resolvePitch(pitch)).toBe(pitch)
	})

	it('throws on invalid pitch strings', () => {
		expect(() => resolvePitch('X4')).toThrow('Invalid pitch')
		expect(() => resolvePitch('C')).toThrow('Invalid pitch')
		expect(() => resolvePitch('C10')).toThrow('Invalid pitch')
		expect(() => resolvePitch('')).toThrow('Invalid pitch')
		expect(() => resolvePitch('c4')).toThrow('Invalid pitch')
	})
})

describe('pitchToMidi', () => {
	it('returns MIDI note number for 12-EDO pitches', () => {
		expect(pitchToMidi(resolvePitch('C4')).note).toBe(60)
		expect(pitchToMidi(resolvePitch('A4')).note).toBe(69)
		expect(pitchToMidi(resolvePitch('C-1')).note).toBe(0)
		expect(pitchToMidi(resolvePitch('G9')).note).toBe(127)
	})

	it('returns zero bend for 12-EDO standard pitches', () => {
		expect(pitchToMidi(resolvePitch('C4')).bend).toBe(0)
		expect(pitchToMidi(resolvePitch('F#3')).bend).toBe(0)
	})

	it('returns non-zero bend for microtonal pitches', () => {
		// C4 + quarter-tone in 24-EDO: midiFloat = 0.5 + 60 = 60.5, rounds to 61
		const quarterTone = { class: 1, stepsPerOctave: 24, octave: 4, octaveRatio: 2 }
		const { note, bend } = pitchToMidi(quarterTone)
		expect(note).toBe(61)
		expect(Math.abs(bend)).toBeGreaterThan(0)
	})
})

describe('pitchKey', () => {
	it('returns octave * stepsPerOctave + class', () => {
		expect(pitchKey(resolvePitch('C4'))).toBe(4 * 12 + 0)
		expect(pitchKey(resolvePitch('E4'))).toBe(4 * 12 + 4)
		expect(pitchKey(resolvePitch('C5'))).toBe(5 * 12 + 0)
	})

	it('sorts pitches ascending', () => {
		const pitches = ['E4', 'C4', 'G4'].map(resolvePitch)
		const sorted = pitches.slice().sort((a, b) => pitchKey(a) - pitchKey(b))
		expect(sorted.map((p) => pitchKey(p))).toEqual(
			['C4', 'E4', 'G4'].map(resolvePitch).map(pitchKey),
		)
	})
})

describe('addSteps', () => {
	it('transposes up by semitones', () => {
		expect(addSteps(resolvePitch('C4'), 7)).toEqual(resolvePitch('G4'))
		expect(addSteps(resolvePitch('C4'), 12)).toEqual(resolvePitch('C5'))
	})

	it('transposes down by semitones', () => {
		expect(addSteps(resolvePitch('C4'), -12)).toEqual(resolvePitch('C3'))
		expect(addSteps(resolvePitch('G4'), -7)).toEqual(resolvePitch('C4'))
	})

	it('carries octave correctly', () => {
		expect(addSteps(resolvePitch('B4'), 1)).toEqual(resolvePitch('C5'))
		expect(addSteps(resolvePitch('C5'), -1)).toEqual(resolvePitch('B4'))
	})

	it('preserves stepsPerOctave and octaveRatio', () => {
		const result = addSteps(resolvePitch('C4'), 5)
		expect(result.stepsPerOctave).toBe(12)
		expect(result.octaveRatio).toBe(2)
	})
})

describe('pitchToCents', () => {
	it('returns 0 for same pitch', () => {
		expect(pitchToCents(resolvePitch('C4'), resolvePitch('C4'))).toBe(0)
	})

	it('returns 1200 for an octave up', () => {
		expect(pitchToCents(resolvePitch('C4'), resolvePitch('C5'))).toBeCloseTo(1200)
	})

	it('returns correct semitone cents', () => {
		expect(pitchToCents(resolvePitch('C4'), resolvePitch('D4'))).toBeCloseTo(200)
		expect(pitchToCents(resolvePitch('C4'), resolvePitch('G4'))).toBeCloseTo(700)
	})
})
