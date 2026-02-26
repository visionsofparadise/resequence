import type { Pattern } from "../patterns/pattern";

export interface MarkerPoint {
	readonly beat: number;
	readonly name: string;
}

export function collectMarkers(pattern: Pattern, offsetBeats = 0): ReadonlyArray<MarkerPoint> {
	return pattern.metadatas
		.filter((positioned): positioned is typeof positioned & { meta: { marker: string } } => positioned.meta.marker !== undefined)
		.map((positioned) => ({ beat: positioned.beat + offsetBeats, name: positioned.meta.marker }))
		.sort((left, right) => left.beat - right.beat);
}
