import { AudioPattern, AutomatePattern, MetadataPattern, MidiPattern, type MidiUnit, type Pattern, type Pitch, type ResolvedTuning, SequencePattern, TempoPattern, type TempoMap, type TempoPoint } from "resequence";
import type { AggregatedNote, AudioLane, AutomationLane, Lane, PatternSpan, TimelineData, TimelineSegment } from "./types";

const unitIdMap = new WeakMap<MidiUnit, string>();

let nextUnitId = 0;

function getUnitId(unit: MidiUnit): string {
	if (unit.properties.id) return unit.properties.id;
	let id = unitIdMap.get(unit);
	if (!id) {
		id = `_unit_${nextUnitId++}`;
		unitIdMap.set(unit, id);
	}
	return id;
}

function computeOutputKey(outputs: ReadonlyArray<MidiUnit>): string {
	if (outputs.length === 0) return "unrouted";

	return outputs.map(getUnitId).sort().join("|");
}

function computeLaneKey(outputs: ReadonlyArray<MidiUnit>, tuning: ResolvedTuning | null, timeSignature: readonly [number, number]): string {
	const outputPart = computeOutputKey(outputs);
	const tuningPart = tuning ? tuning.classes.join(",") : "null";
	const tsPart = `${timeSignature[0]}/${timeSignature[1]}`;
	return `${outputPart}::${tuningPart}::${tsPart}`;
}

function patternTypeLabel(pattern: Pattern): string {
	return pattern.type[pattern.type.length - 1] ?? "unknown";
}

function buildNodeId(indexes: ReadonlyArray<number>): string {
	if (indexes.length === 0) return "root";

	return indexes.join("-");
}

interface MetadataContext {
	readonly activeTuning: ResolvedTuning | null;
	readonly activeTimeSignature: readonly [number, number];
}

interface NoteCollector {
	notes: Array<AggregatedNote>;
	spans: Array<PatternSpan>;
	outputKey: string;
	tuning: ResolvedTuning | null;
	timeSignature: readonly [number, number];
}

interface SubtreeState {
	readonly noteLanes: Map<string, NoteCollector>;
	readonly audioLanes: Array<AudioLane>;
	readonly automationLanes: Array<AutomationLane>;
	readonly childSegments: Array<TimelineSegment>;
	readonly encounterOrder: Array<string | { kind: "audio" | "automation"; index: number }>;
}

function createSubtreeState(): SubtreeState {
	return {
		noteLanes: new Map(),
		audioLanes: [],
		automationLanes: [],
		childSegments: [],
		encounterOrder: [],
	};
}

function aggregateSubtree(pattern: Pattern, offset: number, accumulatedOutputs: ReadonlyArray<MidiUnit>, state: SubtreeState, indexes: ReadonlyArray<number>, meta: MetadataContext, tempoPoints: Array<TempoPoint>): void {
	const nodeId = buildNodeId(indexes);
	const isMidi = MidiPattern.is(pattern);

	const currentOutputs = isMidi && pattern.outputs.length > 0 ? [...accumulatedOutputs, ...pattern.outputs] : accumulatedOutputs;

	if (TempoPattern.is(pattern)) {
		tempoPoints.push({ beat: offset, bpm: pattern.properties.bpm });
		const { bpmMin, bpmMax } = pattern.properties;
		for (const keyframe of pattern.properties.keyframes) {
			tempoPoints.push({ beat: offset + keyframe.beat, bpm: bpmMin + keyframe.value * (bpmMax - bpmMin) });
		}
		for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
			aggregateSubtree(child, offset + offsetBeats, currentOutputs, state, [...indexes, childIndex], meta, tempoPoints);
		}
		return;
	}

	if (MetadataPattern.is(pattern)) {
		const updatedMeta: MetadataContext = {
			activeTuning: pattern.properties.meta.tuning ?? meta.activeTuning,
			activeTimeSignature: pattern.properties.meta.timeSignature ?? meta.activeTimeSignature,
		};
		for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
			aggregateSubtree(child, offset + offsetBeats, currentOutputs, state, [...indexes, childIndex], updatedMeta, tempoPoints);
		}
		return;
	}

	if (AudioPattern.is(pattern)) {
		const lane: AudioLane = {
			kind: "audio",
			name: pattern.properties.name,
			patternPath: nodeId,
			startBeat: offset + pattern.startBeat,
			endBeat: offset + pattern.endBeat,
			filePath: pattern.properties.path,
			durationBeats: pattern.properties.durationBeats,
			playFromBeats: pattern.properties.playFromBeats,
			reversed: pattern.properties.reversed,
		};
		const audioIndex = state.audioLanes.length;
		state.audioLanes.push(lane);
		state.encounterOrder.push({ kind: "audio", index: audioIndex });
		return;
	}

	if (AutomatePattern.is(pattern)) {
		const lane: AutomationLane = {
			kind: "automation",
			name: pattern.properties.name,
			patternPath: nodeId,
			paths: pattern.properties.paths,
			source: pattern.properties.source,
			startBeat: offset + pattern.startBeat,
			endBeat: offset + pattern.endBeat,
		};
		const autoIndex = state.automationLanes.length;
		state.automationLanes.push(lane);
		state.encounterOrder.push({ kind: "automation", index: autoIndex });
		return;
	}

	if (SequencePattern.is(pattern) && indexes.length > 0) {
		const childSegs = aggregateSequence(pattern, offset, indexes, meta, tempoPoints);
		state.childSegments.push(...childSegs);
		return;
	}

	if (pattern.notes.length > 0) {
		const outputKey = computeOutputKey(currentOutputs);
		const laneKey = computeLaneKey(currentOutputs, meta.activeTuning, meta.activeTimeSignature);
		const outputIds = currentOutputs.map(getUnitId);

		let collector = state.noteLanes.get(laneKey);
		if (!collector) {
			collector = { notes: [], spans: [], outputKey, tuning: meta.activeTuning, timeSignature: meta.activeTimeSignature };
			state.noteLanes.set(laneKey, collector);
			state.encounterOrder.push(laneKey);
		}

		const span: PatternSpan = {
			patternPath: nodeId,
			patternType: patternTypeLabel(pattern),
			startBeat: offset + pattern.startBeat,
			endBeat: offset + pattern.endBeat,
		};
		collector.spans.push(span);

		for (const { offsetBeats, note } of pattern.notes) {
			collector.notes.push({
				pitch: note.pitch,
				startBeat: offset + offsetBeats + note.startBeat,
				endBeat: offset + offsetBeats + note.endBeat,
				velocity: note.velocity,
				lyric: note.lyric,
				slides: note.slides,
				patternPath: nodeId,
			});
		}

		// Ensure output IDs are stored (first encounter wins)
		if (!collector.spans[0] || collector.spans.length === 1) {
			(collector as { outputIds?: ReadonlyArray<string> }).outputIds = outputIds;
		}
	}

	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		aggregateSubtree(child, offset + offsetBeats, currentOutputs, state, [...indexes, childIndex], meta, tempoPoints);
	}
}

function aggregateSequence(pattern: SequencePattern, offset: number, indexes: ReadonlyArray<number>, meta: MetadataContext, tempoPoints: Array<TempoPoint>): Array<TimelineSegment> {
	const segments: Array<TimelineSegment> = [];

	const isMidi = MidiPattern.is(pattern);
	const currentOutputs: ReadonlyArray<MidiUnit> = isMidi && pattern.outputs.length > 0 ? [...pattern.outputs] : [];

	if (pattern.notes.length > 0) {
		const state = createSubtreeState();
		const outputKey = computeOutputKey(currentOutputs);
		const laneKey = computeLaneKey(currentOutputs, meta.activeTuning, meta.activeTimeSignature);
		const nodeId = buildNodeId(indexes);

		const collector: NoteCollector & { outputIds?: ReadonlyArray<string> } = {
			notes: [],
			spans: [],
			outputKey,
			tuning: meta.activeTuning,
			timeSignature: meta.activeTimeSignature,
			outputIds: currentOutputs.map(getUnitId),
		};
		state.noteLanes.set(laneKey, collector);
		state.encounterOrder.push(laneKey);

		collector.spans.push({
			patternPath: nodeId,
			patternType: patternTypeLabel(pattern),
			startBeat: offset + pattern.startBeat,
			endBeat: offset + pattern.endBeat,
		});

		for (const { offsetBeats, note } of pattern.notes) {
			collector.notes.push({
				pitch: note.pitch,
				startBeat: offset + offsetBeats + note.startBeat,
				endBeat: offset + offsetBeats + note.endBeat,
				velocity: note.velocity,
				lyric: note.lyric,
				slides: note.slides,
				patternPath: nodeId,
			});
		}

		const segEnd = offset + pattern.endBeat;
		const lanes = buildLanes(state, segEnd);
		if (lanes.length > 0) {
			segments.push({
				startBeat: offset + pattern.startBeat,
				endBeat: segEnd,
				lanes,
				children: [],
			});
		}
	}

	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		const childIndexes = [...indexes, childIndex];

		if (SequencePattern.is(child)) {
			segments.push(...aggregateSequence(child, offset + offsetBeats, childIndexes, meta, tempoPoints));
		} else {
			const state = createSubtreeState();
			aggregateSubtree(child, offset + offsetBeats, currentOutputs, state, childIndexes, meta, tempoPoints);
			const childEnd = offset + offsetBeats + child.endBeat;
			const lanes = buildLanes(state, childEnd);

			if (lanes.length > 0 || state.childSegments.length > 0) {
				segments.push({
					startBeat: offset + offsetBeats + child.startBeat,
					endBeat: offset + offsetBeats + child.endBeat,
					lanes,
					children: state.childSegments,
				});
			}
		}
	}

	return segments;
}

function buildLanes(state: SubtreeState, segmentEndBeat?: number): Array<Lane> {
	const lanes: Array<Lane> = [];

	for (const entry of state.encounterOrder) {
		if (typeof entry === "string") {
			const collector = state.noteLanes.get(entry);
			if (!collector || collector.notes.length === 0) continue;

			let minPitch = Infinity;
			let maxPitch = -Infinity;
			for (const note of collector.notes) {
				const semitone = pitchToSemitone(note.pitch);
				if (semitone < minPitch) minPitch = semitone;
				if (semitone > maxPitch) maxPitch = semitone;
			}

			const outputIds = (collector as { outputIds?: ReadonlyArray<string> }).outputIds ?? [];

			lanes.push({
				kind: "notes",
				outputKey: collector.outputKey,
				outputIds,
				notes: collector.notes,
				spans: collector.spans,
				minPitch,
				maxPitch,
				tuning: collector.tuning,
				timeSignature: collector.timeSignature,
			});
		} else if (entry.kind === "audio") {
			const lane = state.audioLanes[entry.index];
			if (lane) lanes.push(lane);
		} else {
			const lane = state.automationLanes[entry.index];
			if (lane) {
				// LFO patterns have zero endBeat — extend to containing segment's endBeat
				if (lane.startBeat === lane.endBeat && segmentEndBeat !== undefined) {
					lanes.push({ ...lane, endBeat: segmentEndBeat });
				} else {
					lanes.push(lane);
				}
			}
		}
	}

	return lanes;
}

function pitchToSemitone(pitch: Pitch): number {
	return pitch.octave * pitch.stepsPerOctave + pitch.class;
}

const DEFAULT_META: MetadataContext = { activeTuning: null, activeTimeSignature: [4, 4] };

const DEFAULT_TEMPO_MAP: TempoMap = [{ beat: 0, bpm: 120 }];

function buildTempoMap(tempoPoints: Array<TempoPoint>): TempoMap {
	if (tempoPoints.length === 0) return DEFAULT_TEMPO_MAP;

	tempoPoints.sort((left, right) => left.beat - right.beat);

	const first = tempoPoints[0];
	if (!first) return DEFAULT_TEMPO_MAP;

	const deduped: Array<TempoPoint> = [first];
	for (let offset = 1; offset < tempoPoints.length; offset++) {
		const point = tempoPoints[offset];
		const prev = deduped[deduped.length - 1];
		if (point && prev && point.beat !== prev.beat) {
			deduped.push(point);
		}
	}

	return deduped;
}

export function aggregateTree(tree: Pattern): TimelineData {
	nextUnitId = 0;
	const tempoPoints: Array<TempoPoint> = [];

	if (SequencePattern.is(tree)) {
		const segments = aggregateSequence(tree, 0, [], DEFAULT_META, tempoPoints);
		return {
			segments,
			totalStartBeat: tree.startBeat,
			totalEndBeat: tree.endBeat,
			tempoMap: buildTempoMap(tempoPoints),
		};
	}

	const state = createSubtreeState();
	aggregateSubtree(tree, 0, [], state, [], DEFAULT_META, tempoPoints);
	const lanes = buildLanes(state, tree.endBeat);

	const segments: Array<TimelineSegment> = [];
	if (lanes.length > 0 || state.childSegments.length > 0) {
		segments.push({
			startBeat: tree.startBeat,
			endBeat: tree.endBeat,
			lanes,
			children: state.childSegments,
		});
	}

	return {
		segments,
		totalStartBeat: tree.startBeat,
		totalEndBeat: tree.endBeat,
		tempoMap: buildTempoMap(tempoPoints),
	};
}
