import type { ScoreNote } from "../note";
import type { PatternNode, RelativeNote } from "../pattern";
import { MidiPattern } from "../pattern";

export type GenerativeCallback = (accumulator: Array<ScoreNote>, index: number, total: number) => Array<ScoreNote>;

export class GenerativePattern extends MidiPattern {
	constructor(
		readonly callback: GenerativeCallback,
		readonly count: number,
		readonly durationBeats: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): GenerativePattern {
		return new GenerativePattern(
			this.callback,
			this.count,
			this.durationBeats,
			this.overrideNode(overrides),
		);
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

	return new GenerativePattern(callback, count, durationBeats, { notes, children: [], startBeat: 0, endBeat: durationBeats });
}
