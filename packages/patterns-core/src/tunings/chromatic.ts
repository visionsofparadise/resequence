import type { Tuning } from "../tuning";
import { addAliases, createTuning } from "../tuning";

const CHROMATIC_CLASSES = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"] as const;

type ChromaticClass = (typeof CHROMATIC_CLASSES)[number];

const BaseChromatic = createTuning({
	classes: CHROMATIC_CLASSES,
	octaveRatio: 2,
	reference: { class: "A", octave: 4, hz: 440 },
});

type ChromaticAlias = "Db" | "Eb" | "Fb" | "Gb" | "Ab" | "Bb" | "Cb" | "Bs" | "Es";

export const Chromatic: Tuning<ChromaticClass | ChromaticAlias> = addAliases(BaseChromatic, {
	Db: "Cs",
	Eb: "Ds",
	Fb: "E",
	Gb: "Fs",
	Ab: "Gs",
	Bb: "As",
	Es: "F",
	Cb: ["B", -1],
	Bs: ["C", 1],
});

// eslint-disable-next-line @typescript-eslint/naming-convention
export const N = Chromatic;
