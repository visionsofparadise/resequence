import { createTuning } from "../tuning";

const CENTS: Record<string, number> = {
	C: 0,
	Cs: 90.225,
	D: 192.18,
	Eb: 294.135,
	E: 390.225,
	F: 498.045,
	Fs: 588.27,
	G: 696.09,
	Gs: 792.18,
	A: 888.27,
	Bb: 996.09,
	B: 1092.18,
};

const C_HZ = 440 / Math.pow(2, (CENTS.A ?? 0) / 1200);
const frequencies: Record<string, number> = {};

for (const [name, cents] of Object.entries(CENTS)) {
	frequencies[name] = C_HZ * Math.pow(2, cents / 1200);
}

export const Werckmeister = createTuning({
	frequencies,
	referenceOctave: 4,
	octaveRatio: 2,
});
