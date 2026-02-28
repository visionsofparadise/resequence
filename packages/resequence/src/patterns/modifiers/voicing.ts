import { addSteps, pitchKey } from "../../utils/pitch";
import type { Pitch } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { collectNotes, mapNotes } from "../utils/tree";

export type VoicingStyle = "close" | "drop2" | "drop3" | "open";

export class VoicingPattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
		readonly style: VoicingStyle,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): VoicingPattern {
		return new VoicingPattern(this.source, this.style, this.overrideNode(overrides));
	}
}

function applyVoicing(group: ReadonlyArray<ScoreNote>, style: VoicingStyle): Map<string, Pitch> {
	const pitchMap = new Map<string, Pitch>();
	if (group.length < 2) return pitchMap;

	const sorted = group.slice().sort((noteA, noteB) => pitchKey(noteA.pitch) - pitchKey(noteB.pitch));
	const firstSorted = sorted[0];
	if (!firstSorted) return pitchMap;

	const baseKey = pitchKey(firstSorted.pitch);
	const spo = firstSorted.pitch.stepsPerOctave;

	const close = sorted.map((scoreNote, groupIndex) => {
		if (groupIndex === 0) return scoreNote.pitch;
		let pitch = scoreNote.pitch;
		while (pitchKey(pitch) > baseKey + spo) pitch = addSteps(pitch, -spo);
		while (pitchKey(pitch) <= baseKey) pitch = addSteps(pitch, spo);
		return pitch;
	});

	let voiced = close;

	if (style === "drop2") {
		voiced = close.slice();
		const dropIndex = voiced.length - 2;
		const secondFromTop = voiced[dropIndex];
		if (secondFromTop) {
			voiced[dropIndex] = addSteps(secondFromTop, -spo);
		}
	} else if (style === "drop3") {
		voiced = close.slice();
		const dropIndex = voiced.length - 3;
		const thirdFromTop = voiced[dropIndex];
		if (thirdFromTop) {
			voiced[dropIndex] = addSteps(thirdFromTop, -spo);
		}
	} else if (style === "open") {
		voiced = close.slice();
		for (let noteIndex = voiced.length - 1; noteIndex >= 0; noteIndex -= 2) {
			const pitch = voiced[noteIndex];
			if (pitch) {
				voiced[noteIndex] = addSteps(pitch, spo);
			}
		}
	}

	for (const [groupIndex, scoreNote] of sorted.entries()) {
		const newPitch = voiced[groupIndex];
		if (newPitch && pitchKey(newPitch) !== pitchKey(scoreNote.pitch)) {
			const key = `${scoreNote.startBeat}:${scoreNote.endBeat}:${pitchKey(scoreNote.pitch)}`;
			pitchMap.set(key, newPitch);
		}
	}

	return pitchMap;
}

export function voicing(pattern: Pattern, style: VoicingStyle): VoicingPattern {
	const allNotes = collectNotes(pattern);

	const byBeat = new Map<number, Array<ScoreNote>>();
	for (const scoreNote of allNotes) {
		let group = byBeat.get(scoreNote.startBeat);
		if (!group) {
			group = [];
			byBeat.set(scoreNote.startBeat, group);
		}
		group.push(scoreNote);
	}

	const pitchChanges = new Map<string, Pitch>();
	for (const group of byBeat.values()) {
		const changes = applyVoicing(group, style);
		for (const [key, pitch] of changes) {
			pitchChanges.set(key, pitch);
		}
	}

	const transformed = mapNotes(pattern, (note, absoluteOffset) => {
		const absStart = absoluteOffset + note.startBeat;
		const absEnd = absoluteOffset + note.endBeat;
		const key = `${absStart}:${absEnd}:${pitchKey(note.pitch)}`;
		const newPitch = pitchChanges.get(key);

		if (newPitch) {
			const shift = pitchKey(newPitch) - pitchKey(note.pitch);
			return {
				...note,
				pitch: newPitch,
				slides: note.slides?.map((sl) => ({ ...sl, pitch: addSteps(sl.pitch, shift) })),
			};
		}

		return note;
	});

	return new VoicingPattern(pattern, style, transformed);
}
