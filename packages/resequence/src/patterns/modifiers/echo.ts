import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { flatMapNotes } from "../utils/tree";

export class EchoPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly interval: number,
		readonly repeats: number,
		readonly decay: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): EchoPattern {
		return new EchoPattern(this.source, this.interval, this.repeats, this.decay, this.overrideNode(overrides));
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

	return new EchoPattern(pattern, interval, repeats, decay, transformed);
}
