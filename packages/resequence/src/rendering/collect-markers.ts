import type { Pattern } from "../patterns/pattern";

export interface MarkerPoint {
	readonly tick: number;
	readonly name: string;
}

export function collectMarkers(pattern: Pattern, offsetTicks = 0): ReadonlyArray<MarkerPoint> {
	const points: Array<MarkerPoint> = [];

	walkMarkers(pattern, offsetTicks, points);

	return points.sort((left, right) => left.tick - right.tick);
}

function walkMarkers(pattern: Pattern, offsetTicks: number, points: Array<MarkerPoint>): void {
	if (pattern.type === "marker" && "child" in pattern && "name" in pattern) {
		points.push({ tick: offsetTicks, name: (pattern as { name: string }).name });

		walkMarkers((pattern as { child: Pattern }).child, offsetTicks, points);

		return;
	}

	if (pattern.type === "tempo" && "child" in pattern) {
		walkMarkers((pattern as { child: Pattern }).child, offsetTicks, points);

		return;
	}

	if (pattern.type === "sequence" && "children" in pattern) {
		let cursor = offsetTicks;

		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			walkMarkers(child, cursor, points);
			cursor += child.durationTicks;
		}

		return;
	}

	if (pattern.type === "repeat" && "child" in pattern && "count" in pattern) {
		const child = (pattern as { child: Pattern }).child;
		const count = (pattern as { count: number }).count;
		// TODO: This looks like unsafe type casting

		for (let iteration = 0; iteration < count; iteration++) {
			walkMarkers(child, offsetTicks + child.durationTicks * iteration, points);
		}

		return;
	}

	if (pattern.type === "layer" && "children" in pattern) {
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			walkMarkers(child, offsetTicks, points);
		}

		return;
	}

	if ("child" in pattern && isPattern((pattern as { child: unknown }).child)) {
		walkMarkers((pattern as { child: Pattern }).child, offsetTicks, points);

		return;
	}

	if ("children" in pattern && Array.isArray((pattern as { children: unknown }).children)) {
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			if (isPattern(child)) walkMarkers(child, offsetTicks, points);
		}
	}
}

function isPattern(value: unknown): value is Pattern {
	return typeof value === "object" && value !== null && "type" in value && "durationTicks" in value;
}
