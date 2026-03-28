import { createTuning } from "@resequence/patterns-core";

const REF_HZ = 278;
const CENTS: Record<string, number> = {
	Bem: 0, Gul: 120, Dada: 260, Pelog: 410,
	Lima: 540, Nem: 680, Barang: 820,
};

const frequencies: Record<string, number> = {};

for (const [name, cents] of Object.entries(CENTS)) {
	frequencies[name] = REF_HZ * Math.pow(2, cents / 1200);
}

export const Pelog = createTuning({
	frequencies,
	referenceOctave: 4,
	octaveRatio: 2,
});
