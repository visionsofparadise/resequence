import { addSteps, NUM_OCTAVES } from "../../utils/pitch";
import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import { flatMapNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export interface UnisonSpread {
	readonly pitch?: number;
	readonly cc?: Partial<Record<number, number>>;
}

export interface UnisonProperties extends ModifierProperties {
	readonly voices: number;
	readonly spread: UnisonSpread;
}

export class UnisonPattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "unison"] as const;
	readonly properties: UnisonProperties;

	static is(value: unknown): value is UnisonPattern {
		return ModifierPattern.is(value) && value.type[3] === "unison";
	}

	constructor(properties: OptionalProperties<UnisonProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): UnisonPattern {
		return new UnisonPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function unison(pattern: Pattern | ScoreNote, voices: number, spread: UnisonSpread = {}): UnisonPattern {
	const resolved = toPattern(pattern);
	const transformed = flatMapNotes(resolved, (note) => {
		const result = [];

		for (let voiceIndex = 0; voiceIndex < voices; voiceIndex++) {
			const pitchOffset = Math.round((voiceIndex - (voices - 1) / 2) * (spread.pitch ?? 0));
			let voiceNote = {
				...note,
				pitch: addSteps(note.pitch, pitchOffset),
				slides: note.slides?.map((sl) => ({ ...sl, value: sl.value + pitchOffset / (note.pitch.stepsPerOctave * NUM_OCTAVES) })),
			};

			if (spread.cc) {
				const mergedCc: Partial<Record<number, number>> = { ...note.cc };

				for (const [ccKey, ccSpread] of Object.entries(spread.cc)) {
					const ccNum = Number(ccKey);
					const baseVal = note.cc?.[ccNum] ?? 64;
					mergedCc[ccNum] = Math.round(baseVal + (voiceIndex - (voices - 1) / 2) * (ccSpread ?? 0));
				}

				voiceNote = { ...voiceNote, cc: mergedCc };
			}

			result.push(voiceNote);
		}

		return result;
	});

	return new UnisonPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		voices,
		spread,
		input: resolved,
	});
}
