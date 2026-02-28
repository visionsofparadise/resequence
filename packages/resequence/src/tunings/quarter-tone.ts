import { createTuning } from "../utils/tuning";

const CLASSES = [
	"C", "Cq", "Cs", "Csq", "D", "Dq", "Ds", "Dsq",
	"E", "Eq", "F", "Fq", "Fs", "Fsq", "G", "Gq",
	"Gs", "Gsq", "A", "Aq", "As", "Asq", "B", "Bq",
] as const;

export const QuarterTone = createTuning({
	classes: CLASSES,
	octaveRatio: 2,
	reference: { class: "A", octave: 4, hz: 440 },
});
