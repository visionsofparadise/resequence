import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { Pitch } from "../../utils/pitch";
import { resolvePitch } from "../../utils/pitch";
import type { PatternNode, RelativeNote } from "../pattern";
import { MidiPattern } from "../pattern";

function euclidean(hits: number, steps: number, rotate: number): ReadonlyArray<boolean> {
	if (steps === 0) return [];
	const pattern: Array<boolean> = [];
	for (let stepIndex = 0; stepIndex < steps; stepIndex++) {
		pattern.push((stepIndex * hits) % steps < hits);
	}
	const rotateAmount = ((rotate % steps) + steps) % steps;
	return [...pattern.slice(rotateAmount), ...pattern.slice(0, rotateAmount)];
}

export class DistributePattern extends MidiPattern {
	constructor(
		readonly hits: number,
		readonly steps: number,
		readonly pitch: Pitch,
		readonly stepDuration: number,
		readonly rotate: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): DistributePattern {
		return new DistributePattern(this.hits, this.steps, this.pitch, this.stepDuration, this.rotate, this.overrideNode(overrides));
	}
}

export function distribute(hits: number, steps: number, pitch: string | number | Pitch, stepDuration: Duration | number, rotate = 0): DistributePattern {
	const resolvedPitch = resolvePitch(pitch);
	const resolvedDuration = resolveDuration(stepDuration);
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

	return new DistributePattern(hits, steps, resolvedPitch, resolvedDuration, rotate, { notes, children: [], startBeat: 0, endBeat: durationBeats });
}
