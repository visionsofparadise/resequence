import { ModifierPattern, toPattern, modifyNotes } from "@resequence/patterns-core";
import { mulberry32 } from "../utils/mulberry32";
import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";

export interface JitterProperties extends ModifierProperties {
	readonly amount: number;
	readonly seed: number | undefined;
}

export class JitterPattern extends ModifierPattern<JitterProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "jitter";

	override _setup(): Array<Event> {
		const rng = this.properties.seed !== undefined ? mulberry32(this.properties.seed) : Math.random.bind(Math);

		modifyNotes(this, (note) => {
			const shift = Math.round((rng() * 2 - 1) * this.properties.amount);

			return {
				...note,
				startBeat: note.startBeat + shift,
				endBeat: note.endBeat + shift,
			};
		});

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): JitterPattern {
		return new JitterPattern({
			amount: this.properties.amount,
			seed: this.properties.seed,
			input: this.properties.input,
		});
	}
}

export function jitter(pattern: Pattern | Note, amount: number, seed?: number): JitterPattern {
	const resolved = toPattern(pattern);

	return new JitterPattern({ amount, seed, input: resolved });
}
