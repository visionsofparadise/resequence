import type { Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, flatModifyNotes } from "@resequence/patterns-core";
export interface EchoProperties extends ModifierProperties {
	readonly interval: number;
	readonly repeats: number;
	readonly decay: number;
}

export class EchoPattern extends ModifierPattern<EchoProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "echo";

	clone(overrides: Partial<PatternProperties>): EchoPattern {
		return new EchoPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function echo(pattern: Pattern | Note, interval: number, repeats: number, decay: number): EchoPattern {
	const resolved = toPattern(pattern);
	const cloned = resolved.clone({});

	flatModifyNotes(cloned, (note) => {
		const result = [note];

		for (let echoIndex = 1; echoIndex <= repeats; echoIndex++) {
			const echoVelocity = Math.round(note.velocity * decay ** echoIndex);

			result.push({
				...note,
				startBeat: note.startBeat + echoIndex * interval,
				endBeat: note.endBeat + echoIndex * interval,
				velocity: Math.max(1, echoVelocity),
			});
		}

		return result;
	});

	return new EchoPattern({
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		interval,
		repeats,
		decay,
		input: resolved,
	});
}
