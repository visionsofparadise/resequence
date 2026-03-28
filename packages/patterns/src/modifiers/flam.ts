import type { Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, flatModifyNotes } from "@resequence/patterns-core";
export interface FlamProperties extends ModifierProperties {
	readonly flamOffset: number;
	readonly graceVelocity: number;
}

export class FlamPattern extends ModifierPattern<FlamProperties> {
	readonly type = ["pattern", "midi", "modifier", "flam"] as const;

	static override is(value: unknown): value is FlamPattern {
		return ModifierPattern.is(value) && value.type[3] === "flam";
	}

	clone(overrides: Partial<PatternProperties>): FlamPattern {
		return new FlamPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function flam(pattern: Pattern | Note, flamOffset: number, graceVelocity = 40): FlamPattern {
	const resolved = toPattern(pattern);
	const cloned = resolved.clone({});

	flatModifyNotes(cloned, (note) => [
		{
			...note,
			startBeat: note.startBeat - flamOffset,
			endBeat: note.startBeat,
			velocity: graceVelocity,
			slides: undefined,
		},
		note,
	]);

	return new FlamPattern({
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		flamOffset,
		graceVelocity,
		input: resolved,
	});
}
