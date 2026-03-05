import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import { flatMapNotes } from "../utils/map";
import { collectNotes } from "../utils/walk";

export interface GateProperties extends ModifierProperties {
	readonly gateSource: Pattern;
}

export class GatePattern extends ModifierPattern<GateProperties> {
	static is(value: unknown): value is GatePattern {
		return value instanceof GatePattern;
	}

	clone(overrides: Partial<PatternProperties>): GatePattern {
		return new GatePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function gate(pattern: Pattern | Note, gatePattern: Pattern): GatePattern {
	const resolved = toPattern(pattern);
	const gateNotes = collectNotes(gatePattern);

	const transformed = flatMapNotes(resolved, (note, { absoluteOffset }) => {
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
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		gateSource: gatePattern,
		input: resolved,
	});
}
