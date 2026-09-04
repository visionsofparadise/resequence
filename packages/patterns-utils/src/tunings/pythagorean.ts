import { createTuning } from "@resequence/patterns-core";

const C_HZ = (440 * 16) / 27;

export const Pythagorean = createTuning({
	frequencies: {
		C: C_HZ,
		Cs: (C_HZ * 2187) / 2048,
		D: (C_HZ * 9) / 8,
		Eb: (C_HZ * 32) / 27,
		E: (C_HZ * 81) / 64,
		F: (C_HZ * 4) / 3,
		Fs: (C_HZ * 729) / 512,
		G: (C_HZ * 3) / 2,
		Gs: (C_HZ * 6561) / 4096,
		A: 440,
		Bb: (C_HZ * 16) / 9,
		B: (C_HZ * 243) / 128,
	},
	referenceOctave: 4,
	octaveRatio: 2,
});
