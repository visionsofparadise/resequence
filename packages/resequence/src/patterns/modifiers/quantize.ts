import type { OptionalProperties } from "../../utils/RequiredProperties";
import { N } from "../../tunings/chromatic";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { sequence, toPattern } from "../sequence";
import { collectNotes, mapNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export interface QuantizeProperties extends ModifierProperties {
	readonly subdivision: number;
	readonly grooveMap: Pattern | undefined;
}

export class QuantizePattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "quantize"] as const;
	readonly properties: QuantizeProperties;

	static is(value: unknown): value is QuantizePattern {
		return ModifierPattern.is(value) && value.type[3] === "quantize";
	}

	constructor(properties: OptionalProperties<QuantizeProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): QuantizePattern {
		return new QuantizePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function quantize(pattern: Pattern | ScoreNote, subdivision: number, grooveMap?: Pattern): QuantizePattern {
	const resolved = toPattern(pattern);
	const grid = subdivision;

	let transformed: Pattern;

	if (!grooveMap) {
		transformed = mapNotes(resolved, (note, { absoluteOffset }) => {
			const absBeat = absoluteOffset + note.startBeat;
			const remainder = absBeat % grid;
			const snapped = absBeat - remainder + (remainder <= grid / 2 ? 0 : grid);
			const shift = snapped - absBeat;
			return { ...note, startBeat: note.startBeat + shift, endBeat: note.endBeat + shift };
		});
	} else {
		const groovePositions = collectNotes(grooveMap)
			.map((grooveNote) => grooveNote.startBeat % grid)
			.sort((tickA, tickB) => tickA - tickB);

		transformed = mapNotes(resolved, (note, { absoluteOffset }) => {
			const absBeat = absoluteOffset + note.startBeat;
			const cycle = Math.floor(absBeat / grid);
			const remainder = absBeat % grid;
			const nearest = groovePositions.reduce((best, grooveTick) => (Math.abs(grooveTick - remainder) < Math.abs(best - remainder) ? grooveTick : best), groovePositions[0] ?? 0);
			const shift = cycle * grid + nearest - absBeat;
			return { ...note, startBeat: note.startBeat + shift, endBeat: note.endBeat + shift };
		});
	}

	return new QuantizePattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		subdivision: grid,
		grooveMap,
		input: resolved,
	});
}

function buildSwingMap(amount: number): Pattern {
	return sequence(N.C4(amount), N.C4(1 - amount));
}

export function shuffle(pattern: Pattern | ScoreNote, amount: number): QuantizePattern {
	return quantize(pattern, 1, buildSwingMap(amount));
}
