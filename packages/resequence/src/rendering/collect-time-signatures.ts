import { MetadataPattern } from "../patterns/metadata";
import type { Pattern } from "../patterns/pattern";

export interface TimeSignaturePoint {
	readonly beat: number;
	readonly timeSignature: readonly [number, number];
}

export function collectTimeSignatures(pattern: Pattern, offsetBeats = 0): ReadonlyArray<TimeSignaturePoint> {
	const points: Array<TimeSignaturePoint> = [];
	walkForTimeSignatures(pattern, offsetBeats, points);
	return points.sort((left, right) => left.beat - right.beat);
}

function walkForTimeSignatures(pattern: Pattern, offsetBeats: number, points: Array<TimeSignaturePoint>): void {
	if (pattern instanceof MetadataPattern && pattern.meta.timeSignature !== undefined) {
		points.push({ beat: offsetBeats, timeSignature: pattern.meta.timeSignature });
	}

	for (const { offsetBeats: childOffset, pattern: child } of pattern.children) {
		walkForTimeSignatures(child, offsetBeats + childOffset, points);
	}
}
