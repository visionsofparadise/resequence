export const TWELVE_TET_CLASSES = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"] as const;

export type TwelveTetClass = (typeof TWELVE_TET_CLASSES)[number];

export type TwelveTetAlias = "Db" | "Eb" | "Fb" | "Gb" | "Ab" | "Bb" | "Cb" | "Bs" | "Es";

export const TWELVE_TET_ALIASES: {
	readonly [K in TwelveTetAlias]: string | readonly [target: string, octaveOffset: number];
} = {
	Db: "Cs",
	Eb: "Ds",
	Fb: "E",
	Gb: "Fs",
	Ab: "Gs",
	Bb: "As",
	Es: "F",
	Cb: ["B", -1],
	Bs: ["C", 1],
};
