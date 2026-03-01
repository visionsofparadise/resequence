import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import { flatMapNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export interface EchoProperties extends ModifierProperties {
	readonly interval: number;
	readonly repeats: number;
	readonly decay: number;
}

export class EchoPattern extends ModifierPattern {
	readonly properties: EchoProperties;

	constructor(properties: OptionalProperties<EchoProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): EchoPattern {
		return new EchoPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function echo(pattern: Pattern | ScoreNote, interval: number, repeats: number, decay: number): EchoPattern {
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
