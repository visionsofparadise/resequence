import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import { collectNotes, flatMapNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export interface GateProperties extends ModifierProperties {
	readonly gateSource: Pattern;
}

export class GatePattern extends ModifierPattern {
	readonly properties: GateProperties;

	constructor(properties: OptionalProperties<GateProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): GatePattern {
		return new GatePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function gate(pattern: Pattern | ScoreNote, gatePattern: Pattern): GatePattern {
	const resolved = toPattern(pattern);
	const gateNotes = collectNotes(gatePattern);

	const transformed = flatMapNotes(resolved, (note, { absoluteOffset }) => {
		const noteStart = absoluteOffset + note.startBeat;
		const noteEnd = absoluteOffset + note.endBeat;
		const result = [];

		for (const gateNote of gateNotes) {
			const winStart = gateNote.startBeat;
			const winEnd = gateNote.endBeat;
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
