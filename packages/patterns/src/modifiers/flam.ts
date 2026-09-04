import { ModifierPattern, toPattern, flatModifyNotes } from "@resequence/patterns-core";
import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";

export interface FlamProperties extends ModifierProperties {
	readonly flamOffset: number;
	readonly graceVelocity: number;
}

export class FlamPattern extends ModifierPattern<FlamProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "flam";

	override _setup(): Array<Event> {
		flatModifyNotes(this, (note) => [
			{
				...note,
				startBeat: note.startBeat - this.properties.flamOffset,
				endBeat: note.startBeat,
				velocity: this.properties.graceVelocity,
				slides: undefined,
			},
			note,
		]);

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): FlamPattern {
		return new FlamPattern({
			flamOffset: this.properties.flamOffset,
			graceVelocity: this.properties.graceVelocity,
			input: this.properties.input,
		});
	}
}

export function flam(pattern: Pattern | Note, flamOffset: number, graceVelocity = 40): FlamPattern {
	const resolved = toPattern(pattern);

	return new FlamPattern({ flamOffset, graceVelocity, input: resolved });
}
