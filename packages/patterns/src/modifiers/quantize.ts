import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, sequence, toPattern, N, modifyNotes, collectNotes } from "@resequence/patterns-core";
export interface QuantizeProperties extends ModifierProperties {
	readonly subdivision: number;
	readonly grooveMap: Pattern | undefined;
}

export class QuantizePattern extends ModifierPattern<QuantizeProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "quantize";

	override _setup(): Array<Event> {
		const grid = this.properties.subdivision;

		if (!this.properties.grooveMap) {
			modifyNotes(this, (note, { absoluteOffset }) => {
				const absBeat = absoluteOffset + note.startBeat;
				const remainder = absBeat % grid;
				const snapped = absBeat - remainder + (remainder <= grid / 2 ? 0 : grid);
				const shift = snapped - absBeat;

				return { ...note, startBeat: note.startBeat + shift, endBeat: note.endBeat + shift };
			});
		} else {
			const groovePositions = collectNotes(this.properties.grooveMap)
				.map((grooveNote) => grooveNote.absoluteBeat % grid)
				.sort((tickA, tickB) => tickA - tickB);

			modifyNotes(this, (note, { absoluteOffset }) => {
				const absBeat = absoluteOffset + note.startBeat;
				const cycle = Math.floor(absBeat / grid);
				const remainder = absBeat % grid;
				const nearest = groovePositions.reduce((best, grooveTick) => (Math.abs(grooveTick - remainder) < Math.abs(best - remainder) ? grooveTick : best), groovePositions[0] ?? 0);
				const shift = cycle * grid + nearest - absBeat;

				return { ...note, startBeat: note.startBeat + shift, endBeat: note.endBeat + shift };
			});
		}

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): QuantizePattern {
		return new QuantizePattern({ subdivision: this.properties.subdivision, grooveMap: this.properties.grooveMap, input: this.properties.input });
	}
}

export function quantize(pattern: Pattern | Note, subdivision: number, grooveMap?: Pattern): QuantizePattern {
	const resolved = toPattern(pattern);

	return new QuantizePattern({ subdivision, grooveMap, input: resolved });
}

function buildSwingMap(amount: number): Pattern {
	return sequence(N.C4(amount), N.C4(1 - amount));
}

export function shuffle(pattern: Pattern | Note, amount: number): QuantizePattern {
	return quantize(pattern, 1, buildSwingMap(amount));
}
