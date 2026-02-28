import { createTuning } from "../utils/tuning";

const CLASSES = [
	"C", "Cs", "Db", "D", "Ds", "Eb", "E", "Es", "F", "Fs",
	"Gb", "G", "Gs", "Ab", "A", "As", "Bb", "B", "Bs",
] as const;

export const Tet19 = createTuning({
	classes: CLASSES,
	octaveRatio: 2,
	reference: { class: "A", octave: 4, hz: 440 },
});
