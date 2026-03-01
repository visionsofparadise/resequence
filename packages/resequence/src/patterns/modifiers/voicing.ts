import type { Pitch } from "../../utils/pitch";
import { addSteps, NUM_OCTAVES, pitchKey } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import type { OptionalProperties } from "../../utils/RequiredProperties";
import { mapNotes, walkNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export type VoicingStyle = "close" | "drop2" | "drop3" | "open";

export interface VoicingProperties extends ModifierProperties {
	readonly style: VoicingStyle;
}

export class VoicingPattern extends ModifierPattern {
	readonly properties: VoicingProperties;

	constructor(properties: OptionalProperties<VoicingProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): VoicingPattern {
		return new VoicingPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

function applyVoicing(group: ReadonlyArray<{ id: string; pitch: Pitch }>, style: VoicingStyle): Map<string, Pitch> {
	const pitchMap = new Map<string, Pitch>();
	if (group.length < 2) return pitchMap;

	const sorted = group.slice().sort((ea, eb) => pitchKey(ea.pitch) - pitchKey(eb.pitch));
	const firstSorted = sorted[0];
	if (!firstSorted) return pitchMap;

	const baseKey = pitchKey(firstSorted.pitch);
	const spo = firstSorted.pitch.stepsPerOctave;

	const close = sorted.map((entry, groupIndex) => {
		if (groupIndex === 0) return entry.pitch;
		let pitch = entry.pitch;
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

	for (const [groupIndex, entry] of sorted.entries()) {
		const newPitch = voiced[groupIndex];
		if (newPitch && pitchKey(newPitch) !== pitchKey(entry.pitch)) {
			pitchMap.set(entry.id, newPitch);
		}
	}

	return pitchMap;
}

export function voicing(pattern: Pattern | ScoreNote, style: VoicingStyle): VoicingPattern {
	const resolved = toPattern(pattern);
	const entries: Array<{ id: string; absoluteStart: number; pitch: Pitch }> = [];
	walkNotes(resolved, (note, { id, absoluteOffset }) => {
		entries.push({ id, absoluteStart: absoluteOffset + note.startBeat, pitch: note.pitch });
	});

	const byBeat = new Map<number, typeof entries>();
	for (const entry of entries) {
		let group = byBeat.get(entry.absoluteStart);
		if (!group) {
			group = [];
			byBeat.set(entry.absoluteStart, group);
		}
		group.push(entry);
	}

	const pitchChanges = new Map<string, Pitch>();
	for (const group of byBeat.values()) {
		const changes = applyVoicing(group, style);
		for (const [id, pitch] of changes) {
			pitchChanges.set(id, pitch);
		}
	}

	const transformed = mapNotes(resolved, (note, { id }) => {
		const newPitch = pitchChanges.get(id);

		if (newPitch) {
			const shift = pitchKey(newPitch) - pitchKey(note.pitch);
			return {
				...note,
				pitch: newPitch,
				slides: note.slides?.map((sl) => ({ ...sl, value: sl.value + shift / (note.pitch.stepsPerOctave * NUM_OCTAVES) })),
			};
		}

		return note;
	});

	return new VoicingPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		style,
		input: resolved,
	});
}
