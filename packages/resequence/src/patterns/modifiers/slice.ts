import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import { flatMapNotes, walkNodes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export interface SliceProperties extends ModifierProperties {
	readonly from: number;
	readonly to: number;
}

export class SlicePattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "slice"] as const;
	readonly properties: SliceProperties;

	static is(value: unknown): value is SlicePattern {
		return ModifierPattern.is(value) && value.type[3] === "slice";
	}

	constructor(properties: OptionalProperties<SliceProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): SlicePattern {
		return new SlicePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function slice(pattern: Pattern | ScoreNote, from: number, to: number): SlicePattern {
	const resolved = toPattern(pattern);

	const entries: Array<{ note: ScoreNote; absoluteStart: number; absoluteEnd: number }> = [];
	walkNodes(resolved, (node, absoluteOffset) => {
		for (const { offsetBeats, note } of node.notes) {
			const totalOffset = absoluteOffset + offsetBeats;
			entries.push({ note, absoluteStart: totalOffset + note.startBeat, absoluteEnd: totalOffset + note.endBeat });
		}
	});

	entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart);
	const keptEntries = entries.slice(from, to);

	const first = keptEntries[0];
	const last = keptEntries[keptEntries.length - 1];

	if (!first || !last) {
		return new SlicePattern({ notes: [], children: [], startBeat: 0, endBeat: 0, from, to, input: resolved });
	}

	const kept = new Set(keptEntries.map((entry) => entry.note));
	const firstStart = first.absoluteStart;
	const durationBeats = last.absoluteEnd - firstStart;

	const transformed = flatMapNotes(resolved, (note) => {
		if (!kept.has(note)) return [];
		return [{ ...note, startBeat: note.startBeat - firstStart, endBeat: note.endBeat - firstStart }];
	});

	return new SlicePattern({ notes: transformed.notes, children: transformed.children, startBeat: 0, endBeat: durationBeats, from, to, input: resolved });
}

export interface TrimProperties extends ModifierProperties {
	readonly fromBeats: number;
	readonly toBeats: number;
}

export class TrimPattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "trim"] as const;
	readonly properties: TrimProperties;

	static is(value: unknown): value is TrimPattern {
		return ModifierPattern.is(value) && value.type[3] === "trim";
	}

	constructor(properties: OptionalProperties<TrimProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): TrimPattern {
		return new TrimPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function trim(pattern: Pattern | ScoreNote, fromBeats: number, toBeats: number): TrimPattern {
	const resolved = toPattern(pattern);
	const transformed = flatMapNotes(resolved, (note, { absoluteOffset }) => {
		const noteStart = absoluteOffset + note.startBeat;
		const noteEnd = absoluteOffset + note.endBeat;
		const overlapStart = Math.max(noteStart, fromBeats);
		const overlapEnd = Math.min(noteEnd, toBeats);

		if (overlapEnd > overlapStart) {
			return [
				{
					...note,
					startBeat: overlapStart - absoluteOffset - fromBeats,
					endBeat: overlapEnd - absoluteOffset - fromBeats,
				},
			];
		}

		return [];
	});

	const trimDuration = Math.max(0, toBeats - fromBeats);

	return new TrimPattern({ notes: transformed.notes, children: transformed.children, startBeat: 0, endBeat: trimDuration, fromBeats, toBeats, input: resolved });
}
