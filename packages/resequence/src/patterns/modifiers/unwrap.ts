import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { PatternProperties } from "../pattern";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export class UnwrapPattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "unwrap"] as const;
	readonly properties: ModifierProperties;

	static is(value: unknown): value is UnwrapPattern {
		return ModifierPattern.is(value) && value.type[3] === "unwrap";
	}

	constructor(properties: OptionalProperties<ModifierProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
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
