import { createTuning } from "../utils/tuning";

const CLASSES = ["Ji", "Ro", "Lu", "Ma", "Nem"] as const;

export const Slendro = createTuning({
	classes: CLASSES,
	octaveRatio: 2,
	reference: { class: "Ji", octave: 4, hz: 292 },
});
