import { createTuning } from "@resequence/patterns-core";

const C_HZ = 440 / (Math.pow(5, 3 / 4) / 2);

export const Meantone = createTuning({
	frequencies: {
		C: C_HZ,
		Cs: C_HZ * Math.pow(5, 7 / 4) / 16,
		D: C_HZ * Math.sqrt(5) / 2,
		Eb: C_HZ * 8 / Math.pow(5, 3 / 4),
		E: C_HZ * 5 / 4,
		F: C_HZ * 2 / Math.pow(5, 1 / 4),
		Fs: C_HZ * Math.pow(5, 3 / 2) / 8,
		G: C_HZ * Math.pow(5, 1 / 4),
		Gs: C_HZ * 25 / 16,
		A: 440,
		Bb: C_HZ * 4 / Math.sqrt(5),
		B: C_HZ * Math.pow(5, 5 / 4) / 4,
	},
	referenceOctave: 4,
	octaveRatio: 2,
});
