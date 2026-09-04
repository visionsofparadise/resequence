import { ModifierPattern, toPattern, flatModifyNotes, collectNotes } from "@resequence/patterns-core";
import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";

export interface GateProperties extends ModifierProperties {
	readonly gateSource: Pattern;
}

export class GatePattern extends ModifierPattern<GateProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "gate";

	override _setup(): Array<Event> {
		const gateNotes = collectNotes(this.properties.gateSource);

		flatModifyNotes(this, (note, { absoluteOffset }) => {
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

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): GatePattern {
		return new GatePattern({ gateSource: this.properties.gateSource, input: this.properties.input });
	}
}

export function gate(pattern: Pattern | Note, gatePattern: Pattern): GatePattern {
	const resolved = toPattern(pattern);

	return new GatePattern({ gateSource: gatePattern, input: resolved });
}
