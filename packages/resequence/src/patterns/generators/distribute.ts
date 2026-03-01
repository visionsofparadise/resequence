;
;
import type { Pitch } from "../../utils/pitch";
import type { PatternProperties, RelativeNote } from "../pattern";
import { MidiPattern } from "../midi";
import type { MidiPatternProperties } from "../midi";
import type { OptionalProperties } from "../../utils/RequiredProperties";

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

export class DistributePattern extends MidiPattern {
	readonly properties: DistributeProperties;

	constructor(properties: OptionalProperties<DistributeProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): DistributePattern {
		return new DistributePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function distribute(hits: number, steps: number, pitch: Pitch, stepDuration: number, rotate = 0): DistributePattern {
	const resolvedPitch = pitch;
	const resolvedDuration = stepDuration;
	const durationBeats = steps * resolvedDuration;
	const pattern = euclidean(hits, steps, rotate);
	const notes: Array<RelativeNote> = [];

	for (let stepIndex = 0; stepIndex < steps; stepIndex++) {
		if (pattern[stepIndex]) {
			notes.push({
				offsetBeats: stepIndex * resolvedDuration,
				note: { pitch: resolvedPitch, startBeat: 0, endBeat: resolvedDuration, velocity: 100 },
			});
		}
	}

	return new DistributePattern({ notes, children: [], startBeat: 0, endBeat: durationBeats, hits, steps, pitch: resolvedPitch, stepDuration: resolvedDuration, rotate });
}
