import type { Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, modifyNotes } from "@resequence/patterns-core";
export interface LengthProperties extends ModifierProperties {
	readonly noteDuration: number;
}

export class LengthPattern extends ModifierPattern<LengthProperties> {
	readonly type = ["pattern", "midi", "modifier", "length"] as const;

	static override is(value: unknown): value is LengthPattern {
		return ModifierPattern.is(value) && value.type[3] === "length";
	}

	clone(overrides: Partial<PatternProperties>): LengthPattern {
		return new LengthPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function length(pattern: Pattern | Note, duration: number): LengthPattern {
	const resolved = toPattern(pattern);
	const cloned = resolved.clone({});

	modifyNotes(cloned, (note) => {
		const truncatedSlides = note.slides?.filter((sl) => sl.beat <= duration);

		return {
			...note,
			endBeat: note.startBeat + duration,
			slides: truncatedSlides && truncatedSlides.length > 0 ? truncatedSlides : undefined,
		};
	});

	return new LengthPattern({
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		noteDuration: duration,
		input: resolved,
	});
}
