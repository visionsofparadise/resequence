import { ModifierPattern, toPattern, addSteps, NUM_OCTAVES, flatModifyNotes } from "@resequence/patterns-core";
import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";

export interface UnisonSpread {
	readonly pitch?: number;
	readonly cc?: Partial<Record<number, number>>;
}

export interface UnisonProperties extends ModifierProperties {
	readonly voices: number;
	readonly spread: UnisonSpread;
}

export class UnisonPattern extends ModifierPattern<UnisonProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "unison";

	override _setup(): Array<Event> {
		flatModifyNotes(this, (note) => {
			const result = [];

			for (let voiceIndex = 0; voiceIndex < this.properties.voices; voiceIndex++) {
				const pitchOffset = Math.round(
					(voiceIndex - (this.properties.voices - 1) / 2) * (this.properties.spread.pitch ?? 0),
				);
				let voiceNote = {
					...note,
					pitch: addSteps(note.pitch, pitchOffset),
					slides: note.slides?.map((sl) => ({
						...sl,
						value: sl.value + pitchOffset / (note.pitch.stepsPerOctave * NUM_OCTAVES),
					})),
				};

				if (this.properties.spread.cc) {
					const mergedCc: Partial<Record<number, number>> = { ...note.cc };

					for (const [ccKey, ccSpread] of Object.entries(this.properties.spread.cc)) {
						const ccNum = Number(ccKey);
						const baseVal = note.cc?.[ccNum] ?? 64;

						mergedCc[ccNum] = Math.round(
							baseVal + (voiceIndex - (this.properties.voices - 1) / 2) * (ccSpread ?? 0),
						);
					}

					voiceNote = { ...voiceNote, cc: mergedCc };
				}

				result.push(voiceNote);
			}

			return result;
		});

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): UnisonPattern {
		return new UnisonPattern({
			voices: this.properties.voices,
			spread: this.properties.spread,
			input: this.properties.input,
		});
	}
}

export function unison(pattern: Pattern | Note, voices: number, spread: UnisonSpread = {}): UnisonPattern {
	const resolved = toPattern(pattern);

	return new UnisonPattern({ voices, spread, input: resolved });
}
