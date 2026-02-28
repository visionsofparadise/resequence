import { MetadataPattern } from "../patterns/metadata";
import type { Pattern } from "../patterns/pattern";

export interface MarkerPoint {
	readonly beat: number;
	readonly name: string;
}

export function collectMarkers(pattern: Pattern, offsetBeats = 0): ReadonlyArray<MarkerPoint> {
	const markers: Array<MarkerPoint> = [];
	walkForMarkers(pattern, offsetBeats, markers);
	return markers.sort((left, right) => left.beat - right.beat);
}

function walkForMarkers(pattern: Pattern, offsetBeats: number, markers: Array<MarkerPoint>): void {
	if (pattern instanceof MetadataPattern && pattern.meta.marker !== undefined) {
		markers.push({ beat: offsetBeats, name: pattern.meta.marker });
	}

	for (const { offsetBeats: childOffset, pattern: child } of pattern.children) {
		walkForMarkers(child, offsetBeats + childOffset, markers);
	}
}
