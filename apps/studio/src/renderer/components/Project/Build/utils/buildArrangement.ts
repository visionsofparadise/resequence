import {
	AudioPattern,
	AutomatePattern,
	MetadataPattern,
	MidiPattern,
	SequencePattern,
	TempoPattern,
	collectTempoPoints,
	denormalizePitch,
	type Keyframe,
	type Lfo,
	type MidiUnit,
	type Pattern,
	type Pitch,
	type ResolvedTuning,
	type ScoreNote,
	type TempoMap,
	type TempoPoint,
} from "resequence";
import { outputSetColor } from "./outputColor";

export interface MidiClipNote extends ScoreNote {
	readonly patternId: string;
	readonly patternPath: Array<number>;
}

export interface PatternSpan {
	readonly patternId: string;
	readonly patternPath: Array<number>;
	readonly patternType: string;
	readonly startBeat: number;
	readonly endBeat: number;
}

export interface MidiClip {
	readonly type: "midi";
	readonly outputKey: string;
	readonly outputIds: ReadonlyArray<string>;
	readonly notes: ReadonlyArray<MidiClipNote>;
	readonly spans: ReadonlyArray<PatternSpan>;
	readonly minPitch: number;
	readonly maxPitch: number;
	readonly tuning: ResolvedTuning | null;
	readonly timeSignature: readonly [number, number];
	readonly color: string;
}

export interface AudioClip {
	readonly patternId: string;
	readonly patternPath: Array<number>;
	readonly type: "audio";
	readonly name: string;
	readonly startBeat: number;
	readonly endBeat: number;
	readonly filePath: string;
	readonly durationBeats: number;
	readonly playFromBeats: number;
	readonly reversed: boolean;
}

export interface AutomationClip {
	readonly patternId: string;
	readonly patternPath: Array<number>;
	readonly type: "automation";
	readonly name: string;
	readonly paths: ReadonlyArray<string>;
	readonly source: ReadonlyArray<Keyframe> | Lfo;
	readonly startBeat: number;
	readonly endBeat: number;
}

export type Clip = MidiClip | AudioClip | AutomationClip;

export interface Sequence {
	readonly patternId: string;
	readonly patternPath: Array<number>;
	readonly startBeat: number;
	readonly endBeat: number;
	readonly clips: ReadonlyArray<Clip>;
	readonly children: ReadonlyArray<Sequence>;
}

export interface Arrangement {
	readonly sequences: ReadonlyArray<Sequence>;
	readonly tempoMap: TempoMap;
	readonly startBeat: number;
	readonly endBeat: number;
}

function computeOutputKey(outputs: ReadonlyArray<MidiUnit>): string {
	if (outputs.length === 0) return "unrouted";

	return outputs
		.map((output) => output.id)
		.sort()
		.join("|");
}

function computeClipKey(outputs: ReadonlyArray<MidiUnit>, tuning: ResolvedTuning | null, timeSignature: readonly [number, number]): string {
	const outputPart = computeOutputKey(outputs);
	const tuningPart = tuning ? tuning.classes.join(",") : "null";
	const tsPart = `${timeSignature[0]}/${timeSignature[1]}`;

	return `${outputPart}::${tuningPart}::${tsPart}`;
}

function patternTypeLabel(pattern: Pattern): string {
	return pattern.type[pattern.type.length - 1] ?? "unknown";
}

interface MetadataContext {
	readonly activeTuning: ResolvedTuning | null;
	readonly activeTimeSignature: readonly [number, number];
	readonly ancestorHasTempo: boolean;
}

interface NoteCollector {
	notes: Array<MidiClipNote>;
	spans: Array<PatternSpan>;
	outputKey: string;
	tuning: ResolvedTuning | null;
	timeSignature: readonly [number, number];
}

interface SubtreeState {
	readonly midiClips: Map<string, NoteCollector>;
	readonly audioClips: Array<AudioClip>;
	readonly automationClips: Array<AutomationClip>;
	readonly childSequences: Array<Sequence>;
	readonly encounterOrder: Array<string | { kind: "audio" | "automation"; index: number }>;
}

function createSubtreeState(): SubtreeState {
	return {
		midiClips: new Map(),
		audioClips: [],
		automationClips: [],
		childSequences: [],
		encounterOrder: [],
	};
}

function buildPatternId(indexes: ReadonlyArray<number>): string {
	if (indexes.length === 0) return "root";

	return indexes.join("-");
}

function collectSubtree(
	pattern: Pattern,
	offset: number,
	accumulatedOutputs: ReadonlyArray<MidiUnit>,
	state: SubtreeState,
	indexes: ReadonlyArray<number>,
	meta: MetadataContext,
	tempoPoints: Array<TempoPoint>,
): void {
	const patternId = buildPatternId(indexes);
	const isMidi = MidiPattern.is(pattern);

	const currentOutputs = isMidi && pattern.outputs.length > 0 ? [...accumulatedOutputs, ...pattern.outputs] : accumulatedOutputs;

	if (TempoPattern.is(pattern)) {
		if (!meta.ancestorHasTempo || pattern.properties.isOverride) {
			collectTempoPoints(pattern.properties.bpm, pattern.properties.keyframes, offset, tempoPoints);
			meta = { ...meta, ancestorHasTempo: true };
		}
	}

	if (MetadataPattern.is(pattern)) {
		const updatedMeta: MetadataContext = {
			...meta,
			activeTuning: pattern.properties.meta.tuning ?? meta.activeTuning,
			activeTimeSignature: pattern.properties.meta.timeSignature ?? meta.activeTimeSignature,
		};

		for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
			collectSubtree(child, offset + offsetBeats, currentOutputs, state, [...indexes, childIndex], updatedMeta, tempoPoints);
		}

		return;
	}

	if (AudioPattern.is(pattern)) {
		const clip: AudioClip = {
			type: "audio",
			patternId,
			patternPath: [...indexes],
			name: pattern.properties.name,
			startBeat: offset + pattern.startBeat,
			endBeat: offset + pattern.endBeat,
			filePath: pattern.properties.path,
			durationBeats: pattern.properties.durationBeats,
			playFromBeats: pattern.properties.playFromBeats,
			reversed: pattern.properties.reversed,
		};

		const audioIndex = state.audioClips.length;
		state.audioClips.push(clip);
		state.encounterOrder.push({ kind: "audio", index: audioIndex });

		return;
	}

	if (AutomatePattern.is(pattern)) {
		const clip: AutomationClip = {
			type: "automation",
			patternId,
			patternPath: [...indexes],
			name: pattern.properties.name,
			paths: pattern.properties.paths,
			source: pattern.properties.source,
			startBeat: offset + pattern.startBeat,
			endBeat: offset + pattern.endBeat,
		};

		const autoIndex = state.automationClips.length;
		state.automationClips.push(clip);
		state.encounterOrder.push({ kind: "automation", index: autoIndex });

		return;
	}

	if (SequencePattern.is(pattern) && indexes.length > 0) {
		const childSequences = collectSequences(pattern, offset, indexes, meta, tempoPoints);
		state.childSequences.push(...childSequences);

		return;
	}

	if (pattern.notes.length > 0) {
		const outputKey = computeOutputKey(currentOutputs);
		const clipKey = computeClipKey(currentOutputs, meta.activeTuning, meta.activeTimeSignature);
		const outputIds: Array<string> = [];
		for (const unit of currentOutputs) {
			if (unit.id) outputIds.push(unit.id);
		}

		let collector = state.midiClips.get(clipKey);

		if (!collector) {
			collector = { notes: [], spans: [], outputKey, tuning: meta.activeTuning, timeSignature: meta.activeTimeSignature };
			state.midiClips.set(clipKey, collector);
			state.encounterOrder.push(clipKey);
		}

		const span: PatternSpan = {
			patternId,
			patternPath: [...indexes],
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
				patternId,
				patternPath: [...indexes],
			});
		}

		// Ensure output IDs are stored (first encounter wins)
		if (!collector.spans[0] || collector.spans.length === 1) {
			(collector as { outputIds?: ReadonlyArray<string> }).outputIds = outputIds;
		}
	}

	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		collectSubtree(child, offset + offsetBeats, currentOutputs, state, [...indexes, childIndex], meta, tempoPoints);
	}
}

function collectSequences(pattern: SequencePattern, offset: number, indexes: ReadonlyArray<number>, meta: MetadataContext, tempoPoints: Array<TempoPoint>): Array<Sequence> {
	const sequences: Array<Sequence> = [];

	const isMidi = MidiPattern.is(pattern);
	const currentOutputs: ReadonlyArray<MidiUnit> = isMidi && pattern.outputs.length > 0 ? [...pattern.outputs] : [];

	if (pattern.notes.length > 0) {
		const state = createSubtreeState();
		const patternId = buildPatternId(indexes);
		const outputKey = computeOutputKey(currentOutputs);
		const clipKey = computeClipKey(currentOutputs, meta.activeTuning, meta.activeTimeSignature);

		const outputIds: Array<string> = [];
		for (const unit of currentOutputs) {
			if (unit.id) outputIds.push(unit.id);
		}

		const collector: NoteCollector & { outputIds?: ReadonlyArray<string> } = {
			notes: [],
			spans: [],
			outputKey,
			tuning: meta.activeTuning,
			timeSignature: meta.activeTimeSignature,
			outputIds,
		};
		state.midiClips.set(clipKey, collector);
		state.encounterOrder.push(clipKey);

		collector.spans.push({
			patternId,
			patternPath: [...indexes],
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
				patternId,
				patternPath: [...indexes],
			});
		}

		const sequenceEnd = offset + pattern.endBeat;
		const clips = buildClips(state, sequenceEnd);

		if (clips.length > 0) {
			sequences.push({
				patternId,
				patternPath: [...indexes],
				startBeat: offset + pattern.startBeat,
				endBeat: sequenceEnd,
				clips,
				children: [],
			});
		}
	}

	for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
		const childIndexes = [...indexes, childIndex];

		if (SequencePattern.is(child)) {
			sequences.push(...collectSequences(child, offset + offsetBeats, childIndexes, meta, tempoPoints));
		} else {
			const state = createSubtreeState();
			collectSubtree(child, offset + offsetBeats, currentOutputs, state, childIndexes, meta, tempoPoints);

			const childEnd = offset + offsetBeats + child.endBeat;
			const clips = buildClips(state, childEnd);

			if (clips.length > 0 || state.childSequences.length > 0) {
				sequences.push({
					patternId: buildPatternId(childIndexes),
					patternPath: childIndexes,
					startBeat: offset + offsetBeats + child.startBeat,
					endBeat: offset + offsetBeats + child.endBeat,
					clips,
					children: state.childSequences,
				});
			}
		}
	}

	return sequences;
}

function buildClips(state: SubtreeState, endBeat?: number): Array<Clip> {
	const clips: Array<Clip> = [];

	for (const entry of state.encounterOrder) {
		if (typeof entry === "string") {
			const collector = state.midiClips.get(entry);

			if (!collector || collector.notes.length === 0) continue;

			let minPitch = Infinity;
			let maxPitch = -Infinity;

			for (const note of collector.notes) {
				const semitone = pitchToSemitone(note.pitch);

				if (semitone < minPitch) minPitch = semitone;
				if (semitone > maxPitch) maxPitch = semitone;

				if (note.slides) {
					for (const slide of note.slides) {
						const slidePitch = denormalizePitch(slide.value, note.pitch.stepsPerOctave, note.pitch.octaveRatio);
						const slideSemitone = pitchToSemitone(slidePitch);

						if (slideSemitone < minPitch) minPitch = slideSemitone;
						if (slideSemitone > maxPitch) maxPitch = slideSemitone;
					}
				}
			}

			const outputIds = (collector as { outputIds?: ReadonlyArray<string> }).outputIds ?? [];

			clips.push({
				type: "midi",
				outputKey: collector.outputKey,
				outputIds,
				notes: collector.notes,
				spans: collector.spans,
				minPitch,
				maxPitch,
				tuning: collector.tuning,
				timeSignature: collector.timeSignature,
				color: outputSetColor(outputIds),
			});
		} else if (entry.kind === "audio") {
			const clip = state.audioClips[entry.index];

			if (clip) clips.push(clip);
		} else {
			const clip = state.automationClips[entry.index];

			if (clip) {
				// LFO patterns have zero endBeat — extend to containing sequence's endBeat
				if (clip.startBeat === clip.endBeat && endBeat !== undefined) {
					clips.push({ ...clip, endBeat: endBeat });
				} else {
					clips.push(clip);
				}
			}
		}
	}

	return clips;
}

function pitchToSemitone(pitch: Pitch): number {
	return pitch.octave * pitch.stepsPerOctave + pitch.class;
}

const DEFAULT_META: MetadataContext = { activeTuning: null, activeTimeSignature: [4, 4], ancestorHasTempo: false };

export function buildArrangement(rootPattern: Pattern): Arrangement {
	const tempoPoints: Array<TempoPoint> = [];

	if (SequencePattern.is(rootPattern)) {
		const sequences = collectSequences(rootPattern, 0, [], DEFAULT_META, tempoPoints);

		return {
			sequences,
			tempoMap: tempoPoints.sort((left, right) => left.beat - right.beat),
			startBeat: rootPattern.startBeat,
			endBeat: rootPattern.endBeat,
		};
	}

	const state = createSubtreeState();
	collectSubtree(rootPattern, 0, [], state, [], DEFAULT_META, tempoPoints);

	const clips = buildClips(state, rootPattern.endBeat);

	const sequences: Array<Sequence> = [];

	if (clips.length > 0 || state.childSequences.length > 0) {
		sequences.push({
			patternId: "root",
			patternPath: [],
			startBeat: rootPattern.startBeat,
			endBeat: rootPattern.endBeat,
			clips,
			children: state.childSequences,
		});
	}

	return {
		sequences,
		tempoMap: tempoPoints.sort((left, right) => left.beat - right.beat),
		startBeat: rootPattern.startBeat,
		endBeat: rootPattern.endBeat,
	};
}
