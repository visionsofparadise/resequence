import type { Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, flatModifyNotes, collectNotes } from "@resequence/patterns-core";
export interface GateProperties extends ModifierProperties {
	readonly gateSource: Pattern;
}

export class GatePattern extends ModifierPattern<GateProperties> {
	readonly type = ["pattern", "midi", "modifier", "gate"] as const;

	static override is(value: unknown): value is GatePattern {
		return ModifierPattern.is(value) && value.type[3] === "gate";
	}

	clone(overrides: Partial<PatternProperties>): GatePattern {
		return new GatePattern({
			...this.properties,
			...overrides,
		});
	}
}

export function gate(pattern: Pattern | Note, gatePattern: Pattern): GatePattern {
	const resolved = toPattern(pattern);
	const gateNotes = collectNotes(gatePattern);

	const cloned = resolved.clone({});

	flatModifyNotes(cloned, (note, { absoluteOffset }) => {
		const noteStart = absoluteOffset + note.startBeat;
		const noteEnd = absoluteOffset + note.endBeat;
		const result = [];

		for (const gateNote of gateNotes) {
			const winStart = gateNote.absoluteBeat + gateNote.note.startBeat;
			const winEnd = gateNote.absoluteBeat + gateNote.note.endBeat;
			const overlapStart = Math.max(noteStart, winStart);
			const overlapEnd = Math.min(noteEnd, winEnd);

			if (overlapEnd > overlapStart) {
				result.push({
					...note,
					startBeat: overlapStart - absoluteOffset,
					endBeat: overlapEnd - absoluteOffset,
				});
			}
		}

		return result;
	});

	return new GatePattern({
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		gateSource: gatePattern,
		input: resolved,
	});
}
