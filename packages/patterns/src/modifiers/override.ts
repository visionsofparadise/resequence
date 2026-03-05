import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { descendAndClone } from "../utils/descend";

export type OverrideCallback = (properties: PatternProperties) => Partial<PatternProperties>;

export interface OverrideProperties extends ModifierProperties {
	readonly indexes: ReadonlyArray<number>;
	readonly callback: OverrideCallback;
}

export class OverridePattern extends ModifierPattern<OverrideProperties> {
	static is(value: unknown): value is OverridePattern {
		return value instanceof OverridePattern;
	}

	clone(overrides: Partial<PatternProperties>): OverridePattern {
		return new OverridePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function override(pattern: Pattern, indexes: ReadonlyArray<number>, callback: OverrideCallback): OverridePattern {
	const result = descendAndClone(pattern, indexes, (node) => {
		const overrides = callback(node.properties);
		return node.clone(overrides);
	});

	return new OverridePattern({
		...result.properties,
		input: pattern,
		indexes,
		callback,
	});
}
