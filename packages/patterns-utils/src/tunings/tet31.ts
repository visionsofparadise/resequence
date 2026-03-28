import { createTuning } from "@resequence/patterns-core";

const CLASSES = Array.from({ length: 31 }, (_, step) => `s${step}`) as ReadonlyArray<string>;

export const Tet31 = createTuning({
	classes: CLASSES,
	octaveRatio: 2,
	reference: { class: "s23", octave: 4, hz: 440 },
});
