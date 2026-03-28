import { createTuning } from "@resequence/patterns-core";

const CLASSES = ["C", "Db", "D", "E", "Fb", "F", "Gb", "G", "H", "Jb", "J", "A", "Bb"] as const;

export const BohlenPierce = createTuning({
	classes: CLASSES,
	octaveRatio: 3,
	reference: { class: "C", octave: 4, hz: 262 },
});
