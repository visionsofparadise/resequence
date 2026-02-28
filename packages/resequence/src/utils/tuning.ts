import type { ScoreNote } from "../patterns/note";
import { note } from "../patterns/note";
import type { Duration } from "./duration";
import { resolveDuration } from "./duration";
import type { Pitch, TuningConfig } from "./pitch";

export interface TuningEntry {
	readonly pitch: Pitch;
	for(duration: Duration, velocity?: number): ScoreNote;
}

// FIX: This needs to give a utility with typed class names derived from the TuningConfig
export function createTuning(config: TuningConfig): Record<string, TuningEntry> {
	const { classes, octaveRatio = 2, reference } = config;
	const spo = classes.length;
	const refClassIndex = classes.indexOf(reference.class);

	if (refClassIndex === -1) {
		throw new Error(`Reference class '${reference.class}' not found in classes`);
	}

	const namespace: Record<string, TuningEntry> = {};

	for (let octave = 0; octave <= 9; octave++) {
		for (const [classIndex, className] of classes.entries()) {
			const key = `${className}${octave}`;
			const pitch: Pitch = { class: classIndex, stepsPerOctave: spo, octave, octaveRatio };

			namespace[key] = {
				pitch,
				for(duration: Duration, velocity?: number): ScoreNote {
					return note(pitch, resolveDuration(duration), velocity !== undefined ? { velocity } : undefined);
				},
			};
		}
	}

	return namespace;
}
