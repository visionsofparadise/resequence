import { ModifierPattern } from "../patterns/modifier";
import type { PatternProperties } from "../patterns/pattern";

export class UnwrapPattern extends ModifierPattern {
	static is(value: unknown): value is UnwrapPattern {
		return value instanceof UnwrapPattern;
	}

	clone(overrides: Partial<PatternProperties>): UnwrapPattern {
		return new UnwrapPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function unwrap(modifier: ModifierPattern): UnwrapPattern {
	const { input } = modifier.properties;

	return new UnwrapPattern({
		...input.properties,
		input: modifier,
	});
}
