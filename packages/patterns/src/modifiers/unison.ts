import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { addSteps, NUM_OCTAVES } from "../pitch";
import { flatMapNotes } from "../utils/map";

export interface UnisonSpread {
	readonly pitch?: number;
	readonly cc?: Partial<Record<number, number>>;
}

export interface UnisonProperties extends ModifierProperties {
	readonly voices: number;
	readonly spread: UnisonSpread;
}

export class UnisonPattern extends ModifierPattern<UnisonProperties> {
	static is(value: unknown): value is UnisonPattern {
		return value instanceof UnisonPattern;
	}

	clone(overrides: Partial<PatternProperties>): UnisonPattern {
		return new UnisonPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function unison(pattern: Pattern | Note, voices: number, spread: UnisonSpread = {}): UnisonPattern {
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
