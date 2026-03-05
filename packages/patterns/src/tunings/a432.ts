import type { Tuning } from "../tuning";
import { addAliases, createTuning } from "../tuning";

const CLASSES = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"] as const;

type ChromaticClass = (typeof CLASSES)[number];
type ChromaticAlias = "Db" | "Eb" | "Fb" | "Gb" | "Ab" | "Bb" | "Cb" | "Bs" | "Es";

export const A432: Tuning<ChromaticClass | ChromaticAlias> = addAliases(
	createTuning({
		classes: CLASSES,
		octaveRatio: 2,
		reference: { class: "A", octave: 4, hz: 432 },
	}),
	{
		Db: "Cs",
		Eb: "Ds",
		Fb: "E",
		Gb: "Fs",
		Ab: "Gs",
		Bb: "As",
		Es: "F",
		Cb: ["B", -1],
		Bs: ["C", 1],
	},
);
