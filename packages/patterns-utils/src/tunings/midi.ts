import { addAliases, createTuning } from "@resequence/patterns-core";
import { TWELVE_TET_ALIASES, TWELVE_TET_CLASSES, type TwelveTetAlias, type TwelveTetClass } from "./utils/twelveTet";
import type { Tuning } from "@resequence/patterns-core";

export const Midi: Tuning<TwelveTetClass | TwelveTetAlias> = addAliases(
	createTuning({
		classes: TWELVE_TET_CLASSES,
		octaveRatio: 2,
		reference: { class: "A", octave: 4, hz: 440 },
		octaveRange: [-1, 9],
	}),
	TWELVE_TET_ALIASES,
);
