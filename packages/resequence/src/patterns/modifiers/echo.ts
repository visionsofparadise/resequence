import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { flatMapNotes } from "../utils/tree";

export class EchoPattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
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

export function echo(pattern: Pattern, interval: Duration | number, repeats: number, decay: number): EchoPattern {
	const resolvedInterval = resolveDuration(interval);

	const transformed = flatMapNotes(pattern, (note) => {
		const result = [note];

		for (let echoIndex = 1; echoIndex <= repeats; echoIndex++) {
			const echoVelocity = Math.round(note.velocity * decay ** echoIndex);
			result.push({
				...note,
				startBeat: note.startBeat + echoIndex * resolvedInterval,
				endBeat: note.endBeat + echoIndex * resolvedInterval,
				velocity: Math.max(1, echoVelocity),
			});
		}

		return result;
	});

	return new EchoPattern(pattern, resolvedInterval, repeats, decay, transformed);
}
