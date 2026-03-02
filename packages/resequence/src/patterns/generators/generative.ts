import type { ScoreNote } from "../note";
import type { PatternProperties, RelativeNote } from "../pattern";
import { MidiPattern } from "../midi";
import type { MidiPatternProperties } from "../midi";
import type { OptionalProperties } from "../../utils/RequiredProperties";

export type GenerativeCallback = (accumulator: Array<ScoreNote>, index: number, total: number) => Array<ScoreNote>;

export interface GenerativeProperties extends MidiPatternProperties {
	readonly callback: GenerativeCallback;
	readonly count: number;
	readonly durationBeats: number;
}

export class GenerativePattern extends MidiPattern {
	readonly type = ["pattern", "midi", "generative"] as const;
	readonly properties: GenerativeProperties;

	static is(value: unknown): value is GenerativePattern {
		return MidiPattern.is(value) && value.type[2] === "generative";
	}

	constructor(properties: OptionalProperties<GenerativeProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): GenerativePattern {
		return new GenerativePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function generative(callback: GenerativeCallback, count: number, durationBeats: number): GenerativePattern {
	let accumulator: Array<ScoreNote> = [];

	for (let stepIndex = 0; stepIndex < count; stepIndex++) {
		accumulator = callback(accumulator, stepIndex, count);
	}

	const notes: Array<RelativeNote> = [];

	for (const scoreNote of accumulator) {
		if (scoreNote.startBeat >= durationBeats) continue;

		const clipped = scoreNote.endBeat > durationBeats ? { ...scoreNote, endBeat: durationBeats } : scoreNote;

		notes.push({ offsetBeats: 0, note: clipped });
	}

	return new GenerativePattern({ notes, children: [], startBeat: 0, endBeat: durationBeats, callback, count, durationBeats });
}
