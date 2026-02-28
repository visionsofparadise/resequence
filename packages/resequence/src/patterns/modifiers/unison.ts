import { addSteps } from "../../utils/pitch";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { flatMapNotes } from "../utils/tree";

export interface UnisonSpread {
	readonly pitch?: number;
	readonly cc?: Partial<Record<number, number>>;
}

export class UnisonPattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
		readonly voices: number,
		readonly spread: UnisonSpread,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): UnisonPattern {
		return new UnisonPattern(this.source, this.voices, this.spread, this.overrideNode(overrides));
	}
}

export function unison(pattern: Pattern, voices: number, spread: UnisonSpread = {}): UnisonPattern {
	const transformed = flatMapNotes(pattern, (note) => {
		const result = [];

		for (let voiceIndex = 0; voiceIndex < voices; voiceIndex++) {
			const pitchOffset = Math.round((voiceIndex - (voices - 1) / 2) * (spread.pitch ?? 0));
			let voiceNote = {
				...note,
				pitch: addSteps(note.pitch, pitchOffset),
				slides: note.slides?.map((sl) => ({ ...sl, pitch: addSteps(sl.pitch, pitchOffset) })),
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

	return new UnisonPattern(pattern, voices, spread, transformed);
}
