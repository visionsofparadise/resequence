import type { OptionalProperties } from "../../utils/RequiredProperties";
import { pitchKey } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import { flatMapNotes, walkNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export interface HealProperties extends ModifierProperties {
	readonly threshold: number;
}

export class HealPattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "heal"] as const;
	readonly properties: HealProperties;

	static is(value: unknown): value is HealPattern {
		return ModifierPattern.is(value) && value.type[3] === "heal";
	}

	constructor(properties: OptionalProperties<HealProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): HealPattern {
		return new HealPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function heal(pattern: Pattern | ScoreNote, threshold?: number): HealPattern {
	const resolved = toPattern(pattern);
	const resolvedThreshold = threshold ?? 0;
	const entries: Array<{ id: string; absoluteStart: number; absoluteEnd: number; key: number }> = [];
	walkNotes(resolved, (note, { id, absoluteOffset }) => {
		entries.push({ id, absoluteStart: absoluteOffset + note.startBeat, absoluteEnd: absoluteOffset + note.endBeat, key: pitchKey(note.pitch) });
	});
	entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart || ea.key - eb.key);

	const merged = new Set<string>();
	const extensions = new Map<string, number>();

	let last: (typeof entries)[number] | undefined;

	for (const entry of entries) {
		if (last !== undefined) {
			const prevEnd = last.absoluteEnd;
			const gap = entry.absoluteStart - prevEnd;

			if (last.key === entry.key && gap <= resolvedThreshold) {
				extensions.set(last.id, entry.absoluteEnd);
				merged.add(entry.id);
				last = { ...last, absoluteEnd: entry.absoluteEnd };
				continue;
			}
		}

		last = entry;
	}

	const transformed = flatMapNotes(resolved, (note, { id, absoluteOffset }) => {
		if (merged.has(id)) return [];

		const newEndBeat = extensions.get(id);
		if (newEndBeat !== undefined) {
			return [{ ...note, endBeat: newEndBeat - absoluteOffset }];
		}

		return [note];
	});

	return new HealPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		threshold: resolvedThreshold,
		input: resolved,
	});
}
