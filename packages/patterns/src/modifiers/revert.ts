import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { descendAndClone } from "../utils/descend";

export interface RevertProperties extends ModifierProperties {
	readonly indexes: ReadonlyArray<number>;
	readonly steps: number;
}

export class RevertPattern extends ModifierPattern<RevertProperties> {
	readonly type = ["pattern", "midi", "modifier", "revert"] as const;

	static override is(value: unknown): value is RevertPattern {
		return ModifierPattern.is(value) && value.type[3] === "revert";
	}

	clone(overrides: Partial<PatternProperties>): RevertPattern {
		return new RevertPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function revert(pattern: Pattern, indexes: ReadonlyArray<number>, steps: number): RevertPattern {
	const reverted = descendAndClone(pattern, indexes, (node) => {
		let props = node.properties;

		for (let step = 0; step < steps; step++) {
			if (!props.previousProperties) break;
			props = props.previousProperties;
		}

		return node.clone({
			notes: props.notes,
			children: props.children,
			startBeat: props.startBeat,
			endBeat: props.endBeat,
		});
	});

	return new RevertPattern({
		...reverted.properties,
		input: pattern,
		indexes,
		steps,
	});
}
