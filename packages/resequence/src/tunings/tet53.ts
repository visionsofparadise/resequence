import { createTuning } from "../utils/tuning";

const CLASSES = Array.from({ length: 53 }, (_, step) => `s${step}`) as ReadonlyArray<string>;

export const Tet53 = createTuning({
	classes: CLASSES,
	octaveRatio: 2,
	reference: { class: "s40", octave: 4, hz: 440 },
});
