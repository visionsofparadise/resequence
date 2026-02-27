import type { AnyResolvedKeyframe, ResolvedKeyframe } from "../patterns/automate";
import type { Pattern, PositionedAutomation, PositionedMetadata } from "../patterns/pattern";

export interface TempoPoint {
	readonly beat: number;
	readonly bpm: number;
}

export type TempoMap = ReadonlyArray<TempoPoint>;

const TEMPO_PATH = "tempo";
const SAMPLE_RESOLUTION = 0.1;

export function buildTempoMap(pattern: Pattern): TempoMap {
	return buildTempoMapFromSources(pattern.metadatas, pattern.automations);
}

export function buildTempoMapFromSources(
	metadatas: ReadonlyArray<PositionedMetadata>,
	automations: ReadonlyArray<PositionedAutomation>,
): TempoMap {
	const entries: Array<{ beat: number; bpm: number }> = [];

	for (const { beat, meta } of metadatas) {
		if (meta.tempo !== undefined) {
			entries.push({ beat, bpm: meta.tempo });
		}
	}

	for (const { beat: offset, automation } of automations) {
		if (!automation.paths.includes(TEMPO_PATH)) continue;

		const keyframes = automation.envelope;
		if (keyframes.length === 0) continue;

		const duration = automation.durationBeats;
		let sampleBeat = 0;

		while (sampleBeat <= duration) {
			entries.push({ beat: offset + sampleBeat, bpm: evaluateTempoAt(keyframes, sampleBeat) });
			sampleBeat = Math.round((sampleBeat + SAMPLE_RESOLUTION) * 100) / 100;
		}
	}

	return entries.sort((left, right) => left.beat - right.beat);
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

function evaluateTempoAt(keyframes: ReadonlyArray<AnyResolvedKeyframe>, beatPosition: number): number {
	let prevValue = 120;
	let prevTime = 0;
	let prevCurve: ResolvedKeyframe["curve"];
	let nextPoint: ResolvedKeyframe | undefined;

	for (const kf of keyframes) {
		if (kf.kind !== "point") continue;

		if (kf.timeBeats > beatPosition) {
			nextPoint = kf;
			break;
		}

		prevValue = kf.value;
		prevTime = kf.timeBeats;
		prevCurve = kf.curve;
	}

	if (nextPoint === undefined || prevCurve === undefined || prevCurve === "step") {
		return prevValue;
	}

	const fraction = (beatPosition - prevTime) / (nextPoint.timeBeats - prevTime);

	if (prevCurve === "linear") {
		return prevValue + (nextPoint.value - prevValue) * fraction;
	}

	return prevValue * Math.pow(Math.max(nextPoint.value / prevValue, 1e-6), fraction);
}
