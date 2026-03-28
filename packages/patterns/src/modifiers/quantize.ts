import type { Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, sequence, toPattern, N, modifyNotes, collectNotes } from "@resequence/patterns-core";
export interface QuantizeProperties extends ModifierProperties {
	readonly subdivision: number;
	readonly grooveMap: Pattern | undefined;
}

export class QuantizePattern extends ModifierPattern<QuantizeProperties> {
	readonly type = ["pattern", "midi", "modifier", "quantize"] as const;

	static override is(value: unknown): value is QuantizePattern {
		return ModifierPattern.is(value) && value.type[3] === "quantize";
	}

	clone(overrides: Partial<PatternProperties>): QuantizePattern {
		return new QuantizePattern({
			...this.properties,
			...overrides,
		});
	}
}

export function quantize(pattern: Pattern | Note, subdivision: number, grooveMap?: Pattern): QuantizePattern {
	const resolved = toPattern(pattern);
	const grid = subdivision;

	const cloned = resolved.clone({});

	if (!grooveMap) {
		modifyNotes(cloned, (note, { absoluteOffset }) => {
			const absBeat = absoluteOffset + note.startBeat;
			const remainder = absBeat % grid;
			const snapped = absBeat - remainder + (remainder <= grid / 2 ? 0 : grid);
			const shift = snapped - absBeat;

			return { ...note, startBeat: note.startBeat + shift, endBeat: note.endBeat + shift };
		});
	} else {
		const groovePositions = collectNotes(grooveMap)
			.map((grooveNote) => grooveNote.absoluteBeat % grid)
			.sort((tickA, tickB) => tickA - tickB);

		modifyNotes(cloned, (note, { absoluteOffset }) => {
			const absBeat = absoluteOffset + note.startBeat;
			const cycle = Math.floor(absBeat / grid);
			const remainder = absBeat % grid;
			const nearest = groovePositions.reduce((best, grooveTick) => (Math.abs(grooveTick - remainder) < Math.abs(best - remainder) ? grooveTick : best), groovePositions[0] ?? 0);
			const shift = cycle * grid + nearest - absBeat;

			return { ...note, startBeat: note.startBeat + shift, endBeat: note.endBeat + shift };
		});
	}

	return new QuantizePattern({
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		subdivision: grid,
		grooveMap,
		input: resolved,
	});
}

function buildSwingMap(amount: number): Pattern {
	return sequence(N.C4(amount), N.C4(1 - amount));
}

export function shuffle(pattern: Pattern | Note, amount: number): QuantizePattern {
	return quantize(pattern, 1, buildSwingMap(amount));
}
