import type { PatternProperties } from "../patterns/pattern";
import type { Pattern } from "../patterns/pattern";
import type { ModifierProperties } from "../patterns/modifier-pattern";
import { ModifierPattern } from "../patterns/modifier-pattern";
import { descendAndClone } from "../utils/descend";

export interface RevertProperties extends ModifierProperties {
	readonly indexes: ReadonlyArray<number>;
	readonly steps: number;
}

export class RevertPattern extends ModifierPattern<RevertProperties> {
	static is(value: unknown): value is RevertPattern {
		return value instanceof RevertPattern;
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
