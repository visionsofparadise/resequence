import { PPQ } from "../utils/duration";
import type { Pattern } from "../patterns/pattern";

export interface TempoPoint {
	readonly tick: number;
	readonly bpm: number;
}

export type TempoMap = ReadonlyArray<TempoPoint>;

export function buildTempoMap(pattern: Pattern, offsetTicks = 0): TempoMap {
	const points: Array<TempoPoint> = [];
	walkTempo(pattern, offsetTicks, points);
	return points.sort((left, right) => left.tick - right.tick);
}

export function ticksToSeconds(ticks: number, tempoMap: TempoMap): number {
	if (ticks <= 0) return 0;

	let seconds = 0;
	let lastTick = 0;
	let lastBpm = 120;

	for (const point of tempoMap) {
		if (point.tick >= ticks) break;

		const segmentTicks = point.tick - lastTick;
		seconds += (segmentTicks / PPQ) * (60 / lastBpm);

		lastTick = point.tick;
		lastBpm = point.bpm;
	}

	const remainingTicks = ticks - lastTick;
	seconds += (remainingTicks / PPQ) * (60 / lastBpm);

	return seconds;
}

function walkTempo(pattern: Pattern, offsetTicks: number, points: Array<TempoPoint>): void {
	if (pattern.type === "tempo" && "child" in pattern && "bpm" in pattern) {
		points.push({ tick: offsetTicks, bpm: (pattern as { bpm: number }).bpm });
		walkTempo((pattern as { child: Pattern }).child, offsetTicks, points);
		return;
	}

	if (pattern.type === "sequence" && "children" in pattern) {
		let cursor = offsetTicks;
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			walkTempo(child, cursor, points);
			cursor += child.durationTicks;
		}
		return;
	}

	if (pattern.type === "repeat" && "child" in pattern && "count" in pattern) {
		const child = (pattern as { child: Pattern }).child;
		const count = (pattern as { count: number }).count;
		for (let iteration = 0; iteration < count; iteration++) {
			walkTempo(child, offsetTicks + child.durationTicks * iteration, points);
		}
		return;
	}

	if (pattern.type === "layer" && "children" in pattern) {
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			walkTempo(child, offsetTicks, points);
		}
		return;
	}

	if ("child" in pattern && isPattern((pattern as { child: unknown }).child)) {
		walkTempo((pattern as { child: Pattern }).child, offsetTicks, points);
		return;
	}

	if ("children" in pattern && Array.isArray((pattern as { children: unknown }).children)) {
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			if (isPattern(child)) walkTempo(child, offsetTicks, points);
		}
	}
}

function isPattern(value: unknown): value is Pattern {
	return typeof value === "object" && value !== null && "type" in value && "durationTicks" in value;
}
