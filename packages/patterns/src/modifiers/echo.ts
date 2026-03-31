import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, flatModifyNotes } from "@resequence/patterns-core";
export interface EchoProperties extends ModifierProperties {
	readonly interval: number;
	readonly repeats: number;
	readonly decay: number;
}

export class EchoPattern extends ModifierPattern<EchoProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "echo";

	override _setup(): Array<Event> {
		flatModifyNotes(this, (note) => {
			const result = [note];

			for (let echoIndex = 1; echoIndex <= this.properties.repeats; echoIndex++) {
				const echoVelocity = Math.round(note.velocity * this.properties.decay ** echoIndex);

				result.push({
					...note,
					startBeat: note.startBeat + echoIndex * this.properties.interval,
					endBeat: note.endBeat + echoIndex * this.properties.interval,
					velocity: Math.max(1, echoVelocity),
				});
			}

			return result;
		});

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): EchoPattern {
		return new EchoPattern({ interval: this.properties.interval, repeats: this.properties.repeats, decay: this.properties.decay, input: this.properties.input });
	}
}

export function echo(pattern: Pattern | Note, interval: number, repeats: number, decay: number): EchoPattern {
	const resolved = toPattern(pattern);

	return new EchoPattern({ interval, repeats, decay, input: resolved });
}
