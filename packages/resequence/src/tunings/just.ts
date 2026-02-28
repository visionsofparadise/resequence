import { createTuning } from "../utils/tuning";

const C_HZ = 440 * 3 / 5;

export const Just = createTuning({
	frequencies: {
		C: C_HZ,
		Cs: C_HZ * 16 / 15,
		D: C_HZ * 9 / 8,
		Eb: C_HZ * 6 / 5,
		E: C_HZ * 5 / 4,
		F: C_HZ * 4 / 3,
		Fs: C_HZ * 45 / 32,
		G: C_HZ * 3 / 2,
		Gs: C_HZ * 8 / 5,
		A: 440,
		Bb: C_HZ * 9 / 5,
		B: C_HZ * 15 / 8,
	},
	referenceOctave: 4,
	octaveRatio: 2,
});
