import { AudioPattern, AutomatePattern, MidiPattern, type MidiUnit, type Pattern, type Pitch, SequencePattern } from "resequence";
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

function patternTypeLabel(pattern: Pattern): string {
	return pattern.type[pattern.type.length - 1] ?? "unknown";
}

function buildNodeId(indexes: ReadonlyArray<number>): string {
	if (indexes.length === 0) return "root";

	return indexes.join("-");
}

interface NoteCollector {
	notes: Array<AggregatedNote>;
	spans: Array<PatternSpan>;
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

function aggregateSubtree(pattern: Pattern, offset: number, accumulatedOutputs: ReadonlyArray<MidiUnit>, state: SubtreeState, indexes: ReadonlyArray<number>): void {
	const nodeId = buildNodeId(indexes);
	const isMidi = MidiPattern.is(pattern);

	const currentOutputs = isMidi && pattern.outputs.length > 0 ? [...accumulatedOutputs, ...pattern.outputs] : accumulatedOutputs;

	if (AudioPattern.is(pattern)) {
		const lane: AudioLane = {
			kind: "audio",
			name: pattern.properties.name,
			patternPath: nodeId,
			startBeat: offset + pattern.startBeat,
			endBeat: offset + pattern.endBeat,
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
			startBeat: offset + pattern.startBeat,
			endBeat: offset + pattern.endBeat,
		};
		const autoIndex = state.automationLanes.length;
		state.automationLanes.push(lane);
		state.encounterOrder.push({ kind: "automation", index: autoIndex });
		return;
	}

	if (SequencePattern.is(pattern) && indexes.length > 0) {
		const childSegs = aggregateSequence(pattern, offset, indexes);
		state.childSegments.push(...childSegs);
		return;
	}

	if (pattern.notes.length > 0) {
		const outputKey = computeOutputKey(currentOutputs);
		const outputIds = currentOutputs.map(getUnitId);

		let collector = state.noteLanes.get(outputKey);
		if (!collector) {
			collector = { notes: [], spans: [] };
			state.noteLanes.set(outputKey, collector);
			state.encounterOrder.push(outputKey);
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
				patternPath: nodeId,
			});
		}

		// Ensure output IDs are stored (first encounter wins)
		if (!collector.spans[0] || collector.spans.length === 1) {
			(collector as { outputIds?: ReadonlyArray<string> }).outputIds = outputIds;
		}
	}

	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		aggregateSubtree(child, offset + offsetBeats, currentOutputs, state, [...indexes, childIndex]);
	}
}

function aggregateSequence(pattern: SequencePattern, offset: number, indexes: ReadonlyArray<number>): Array<TimelineSegment> {
	const segments: Array<TimelineSegment> = [];

	const isMidi = MidiPattern.is(pattern);
	const currentOutputs: ReadonlyArray<MidiUnit> = isMidi && pattern.outputs.length > 0 ? [...pattern.outputs] : [];

	if (pattern.notes.length > 0) {
		const state = createSubtreeState();
		const outputKey = computeOutputKey(currentOutputs);
		const nodeId = buildNodeId(indexes);

		const collector: NoteCollector & { outputIds?: ReadonlyArray<string> } = {
			notes: [],
			spans: [],
			outputIds: currentOutputs.map(getUnitId),
		};
		state.noteLanes.set(outputKey, collector);
		state.encounterOrder.push(outputKey);

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
				patternPath: nodeId,
			});
		}

		const lanes = buildLanes(state);
		if (lanes.length > 0) {
			segments.push({
				startBeat: offset + pattern.startBeat,
				endBeat: offset + pattern.endBeat,
				lanes,
				children: [],
			});
		}
	}

	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		const childIndexes = [...indexes, childIndex];

		if (SequencePattern.is(child)) {
			segments.push(...aggregateSequence(child, offset + offsetBeats, childIndexes));
		} else {
			const state = createSubtreeState();
			aggregateSubtree(child, offset + offsetBeats, currentOutputs, state, childIndexes);
			const lanes = buildLanes(state);

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

function buildLanes(state: SubtreeState): Array<Lane> {
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
				outputKey: entry,
				outputIds,
				notes: collector.notes,
				spans: collector.spans,
				minPitch,
				maxPitch,
			});
		} else if (entry.kind === "audio") {
			const lane = state.audioLanes[entry.index];
			if (lane) lanes.push(lane);
		} else {
			const lane = state.automationLanes[entry.index];
			if (lane) lanes.push(lane);
		}
	}

	return lanes;
}

function pitchToSemitone(pitch: Pitch): number {
	return pitch.octave * pitch.stepsPerOctave + pitch.class;
}

export function aggregateTree(tree: Pattern): TimelineData {
	nextUnitId = 0;

	if (SequencePattern.is(tree)) {
		const segments = aggregateSequence(tree, 0, []);
		return {
			segments,
			totalStartBeat: tree.startBeat,
			totalEndBeat: tree.endBeat,
		};
	}

	const state = createSubtreeState();
	aggregateSubtree(tree, 0, [], state, []);
	const lanes = buildLanes(state);

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
	};
}
