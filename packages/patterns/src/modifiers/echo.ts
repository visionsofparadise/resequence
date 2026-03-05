import type { Note } from "../note";
import type { PatternProperties } from "../patterns/pattern";
import type { Pattern } from "../patterns/pattern";
import type { ModifierProperties } from "../patterns/modifier-pattern";
import { ModifierPattern } from "../patterns/modifier-pattern";
import { toPattern } from "../patterns/sequence";
import { flatMapNotes } from "../utils/map";

export interface EchoProperties extends ModifierProperties {
	readonly interval: number;
	readonly repeats: number;
	readonly decay: number;
}

export class EchoPattern extends ModifierPattern<EchoProperties> {
	static is(value: unknown): value is EchoPattern {
		return value instanceof EchoPattern;
	}

	clone(overrides: Partial<PatternProperties>): EchoPattern {
		return new EchoPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function echo(pattern: Pattern | Note, interval: number, repeats: number, decay: number): EchoPattern {
	const resolved = toPattern(pattern);
	const transformed = flatMapNotes(resolved, (note) => {
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
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		interval,
		repeats,
		decay,
		input: resolved,
	});
}
