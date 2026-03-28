import type { MidiPatternProperties } from "../patterns/midi";
import { MidiPattern } from "../patterns/midi";
import type { PatternProperties, RelativeNote } from "../patterns/pattern";
import type { Pitch } from "../pitch";

function euclidean(hits: number, steps: number, rotate: number): ReadonlyArray<boolean> {
	if (steps === 0) return [];
	const pattern: Array<boolean> = [];

	for (let stepIndex = 0; stepIndex < steps; stepIndex++) {
		pattern.push((stepIndex * hits) % steps < hits);
	}

	const rotateAmount = ((rotate % steps) + steps) % steps;

	return [...pattern.slice(rotateAmount), ...pattern.slice(0, rotateAmount)];
}

export interface DistributeProperties extends MidiPatternProperties {
	readonly hits: number;
	readonly steps: number;
	readonly pitch: Pitch;
	readonly stepDuration: number;
	readonly rotate: number;
}

export class DistributePattern extends MidiPattern<DistributeProperties> {
	readonly type = ["pattern", "midi", "generator", "distribute"] as const;

	static override is(value: unknown): value is DistributePattern {
		return MidiPattern.is(value) && value.type[2] === "generator" && value.type[3] === "distribute";
	}

	clone(overrides: Partial<PatternProperties>): DistributePattern {
		return new DistributePattern({
			...this.properties,
			...overrides,
		});
	}
}

export function distribute(hits: number, steps: number, pitch: Pitch, stepDuration: number, rotate = 0): DistributePattern {
	const durationBeats = steps * stepDuration;
	const pattern = euclidean(hits, steps, rotate);
	const notes: Array<RelativeNote> = [];

	for (let stepIndex = 0; stepIndex < steps; stepIndex++) {
		if (pattern[stepIndex]) {
			notes.push({
				offsetBeats: stepIndex * stepDuration,
				note: { pitch, startBeat: 0, endBeat: stepDuration, velocity: 100 },
			});
		}
	}

	return new DistributePattern({ notes, children: [], startBeat: 0, endBeat: durationBeats, hits, steps, pitch, stepDuration, rotate });
}
