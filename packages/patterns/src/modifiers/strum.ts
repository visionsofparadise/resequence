import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, pitchKey, modifyNotes, walkNotes } from "@resequence/patterns-core";
export interface StrumOptions {
	readonly strumOffset?: number;
	readonly direction?: "up" | "down";
}

export interface StrumProperties extends ModifierProperties {
	readonly strumOptions: StrumOptions;
}

export class StrumPattern extends ModifierPattern<StrumProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "strum";

	override _setup(): Array<Event> {
		const strumOffset = this.properties.strumOptions.strumOffset ?? 15;
		const direction = this.properties.strumOptions.direction ?? "up";
		const entries: Array<{ id: string; absoluteStart: number; key: number }> = [];

		walkNotes(this, (note, { id, absoluteOffset }) => {
			entries.push({ id, absoluteStart: absoluteOffset + note.startBeat, key: pitchKey(note.pitch) });
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

		const shiftMap = new Map<string, number>();

		for (const group of byBeat.values()) {
			const sorted = direction === "up" ? group.slice().sort((ea, eb) => ea.key - eb.key) : group.slice().sort((ea, eb) => eb.key - ea.key);

			for (const [voiceIndex, entry] of sorted.entries()) {
				shiftMap.set(entry.id, voiceIndex * strumOffset);
			}
		}

		modifyNotes(this, (note, { id }) => {
			const shift = shiftMap.get(id);

			if (shift) {
				return { ...note, startBeat: note.startBeat + shift, endBeat: note.endBeat + shift };
			}

			return note;
		});

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): StrumPattern {
		return new StrumPattern({ strumOptions: this.properties.strumOptions, input: this.properties.input });
	}
}

export function strum(pattern: Pattern | Note, options: StrumOptions = {}): StrumPattern {
	const resolved = toPattern(pattern);

	return new StrumPattern({ strumOptions: options, input: resolved });
}
