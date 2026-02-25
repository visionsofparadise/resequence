import type { Pattern } from "../patterns/pattern";

export interface TempoPoint {
	readonly beat: number;
	readonly bpm: number;
}

export type TempoMap = ReadonlyArray<TempoPoint>;

export function buildTempoMap(pattern: Pattern, offsetBeats = 0): TempoMap {
	const points: Array<TempoPoint> = [];
	walkTempo(pattern, offsetBeats, points);
	return points.sort((left, right) => left.beat - right.beat);
}

export function beatsToSeconds(beats: number, tempoMap: TempoMap): number {
	if (beats <= 0) return 0;

	let seconds = 0;
	let lastBeat = 0;
	let lastBpm = 120;

	for (const point of tempoMap) {
		if (point.beat >= beats) break;

		seconds += (point.beat - lastBeat) * (60 / lastBpm);

		lastBeat = point.beat;
		lastBpm = point.bpm;
	}

	seconds += (beats - lastBeat) * (60 / lastBpm);

	return seconds;
}

function walkTempo(pattern: Pattern, offsetBeats: number, points: Array<TempoPoint>): void {
	if (pattern.type === "tempo" && "child" in pattern && "bpm" in pattern) {
		points.push({ beat: offsetBeats, bpm: (pattern as { bpm: number }).bpm });
		walkTempo((pattern as { child: Pattern }).child, offsetBeats, points);
		return;
	}

	if (pattern.type === "sequence" && "children" in pattern) {
		let cursor = offsetBeats;
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			walkTempo(child, cursor, points);
			cursor += child.durationBeats;
		}
		return;
	}

	if (pattern.type === "repeat" && "child" in pattern && "count" in pattern) {
		const child = (pattern as { child: Pattern }).child;
		const count = (pattern as { count: number }).count;
		for (let iteration = 0; iteration < count; iteration++) {
			walkTempo(child, offsetBeats + child.durationBeats * iteration, points);
		}
		return;
	}

	if (pattern.type === "layer" && "children" in pattern) {
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			walkTempo(child, offsetBeats, points);
		}
		return;
	}

	if ("child" in pattern && isPattern((pattern as { child: unknown }).child)) {
		walkTempo((pattern as { child: Pattern }).child, offsetBeats, points);
		return;
	}

	if ("children" in pattern && Array.isArray((pattern as { children: unknown }).children)) {
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			if (isPattern(child)) walkTempo(child, offsetBeats, points);
		}
	}
}

export interface TimeSignaturePoint {
	readonly beat: number;
	readonly timeSignature: readonly [number, number];
}

export function buildTimeSignatureMap(pattern: Pattern, offsetBeats = 0): ReadonlyArray<TimeSignaturePoint> {
	const points: Array<TimeSignaturePoint> = [];
	walkTimeSignature(pattern, offsetBeats, points);
	return points.sort((left, right) => left.beat - right.beat);
}

function walkTimeSignature(pattern: Pattern, offsetBeats: number, points: Array<TimeSignaturePoint>): void {
	if (pattern.type === "timeSignature" && "child" in pattern && "timeSignature" in pattern) {
		points.push({ beat: offsetBeats, timeSignature: (pattern as { timeSignature: readonly [number, number] }).timeSignature });
		walkTimeSignature((pattern as { child: Pattern }).child, offsetBeats, points);
		return;
	}

	if (pattern.type === "sequence" && "children" in pattern) {
		let cursor = offsetBeats;
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			walkTimeSignature(child, cursor, points);
			cursor += child.durationBeats;
		}
		return;
	}

	if (pattern.type === "repeat" && "child" in pattern && "count" in pattern) {
		const child = (pattern as { child: Pattern }).child;
		const count = (pattern as { count: number }).count;
		for (let iteration = 0; iteration < count; iteration++) {
			walkTimeSignature(child, offsetBeats + child.durationBeats * iteration, points);
		}
		return;
	}

	if (pattern.type === "layer" && "children" in pattern) {
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			walkTimeSignature(child, offsetBeats, points);
		}
		return;
	}

	if ("child" in pattern && isPattern((pattern as { child: unknown }).child)) {
		walkTimeSignature((pattern as { child: Pattern }).child, offsetBeats, points);
		return;
	}

	if ("children" in pattern && Array.isArray((pattern as { children: unknown }).children)) {
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			if (isPattern(child)) walkTimeSignature(child, offsetBeats, points);
		}
	}
}

function isPattern(value: unknown): value is Pattern {
	return typeof value === "object" && value !== null && "type" in value && "durationBeats" in value;
}
