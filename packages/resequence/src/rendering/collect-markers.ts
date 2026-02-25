import type { Pattern } from "../patterns/pattern";

export interface MarkerPoint {
	readonly beat: number;
	readonly name: string;
}

export function collectMarkers(pattern: Pattern, offsetBeats = 0): ReadonlyArray<MarkerPoint> {
	const points: Array<MarkerPoint> = [];

	walkMarkers(pattern, offsetBeats, points);

	return points.sort((left, right) => left.beat - right.beat);
}

function walkMarkers(pattern: Pattern, offsetBeats: number, points: Array<MarkerPoint>): void {
	if (pattern.type === "marker" && "child" in pattern && "name" in pattern) {
		points.push({ beat: offsetBeats, name: (pattern as { name: string }).name });

		walkMarkers((pattern as { child: Pattern }).child, offsetBeats, points);

		return;
	}

	if (pattern.type === "tempo" && "child" in pattern) {
		walkMarkers((pattern as { child: Pattern }).child, offsetBeats, points);

		return;
	}

	if (pattern.type === "sequence" && "children" in pattern) {
		let cursor = offsetBeats;

		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			walkMarkers(child, cursor, points);
			cursor += child.durationBeats;
		}

		return;
	}

	if (pattern.type === "repeat" && "child" in pattern && "count" in pattern) {
		const child = (pattern as { child: Pattern }).child;
		const count = (pattern as { count: number }).count;
		// TODO: This looks like unsafe type casting

		for (let iteration = 0; iteration < count; iteration++) {
			walkMarkers(child, offsetBeats + child.durationBeats * iteration, points);
		}

		return;
	}

	if (pattern.type === "layer" && "children" in pattern) {
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			walkMarkers(child, offsetBeats, points);
		}

		return;
	}

	if ("child" in pattern && isPattern((pattern as { child: unknown }).child)) {
		walkMarkers((pattern as { child: Pattern }).child, offsetBeats, points);

		return;
	}

	if ("children" in pattern && Array.isArray((pattern as { children: unknown }).children)) {
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			if (isPattern(child)) walkMarkers(child, offsetBeats, points);
		}
	}
}

function isPattern(value: unknown): value is Pattern {
	return typeof value === "object" && value !== null && "type" in value && "durationBeats" in value;
}
