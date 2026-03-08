import { ModifierPattern } from "../patterns/modifier";
import type { PatternProperties } from "../patterns/pattern";

export class UnwrapPattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "unwrap"] as const;

	static override is(value: unknown): value is UnwrapPattern {
		return ModifierPattern.is(value) && value.type[3] === "unwrap";
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
