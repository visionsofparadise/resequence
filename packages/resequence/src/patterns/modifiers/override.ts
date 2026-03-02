import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { Pattern, PatternProperties } from "../pattern";
import { descendAndClone } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export type OverrideCallback = (properties: PatternProperties) => Partial<PatternProperties>;

export interface OverrideProperties extends ModifierProperties {
	readonly indexes: ReadonlyArray<number>;
	readonly callback: OverrideCallback;
}

export class OverridePattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "override"] as const;
	readonly properties: OverrideProperties;

	static is(value: unknown): value is OverridePattern {
		return ModifierPattern.is(value) && value.type[3] === "override";
	}

	constructor(properties: OptionalProperties<OverrideProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
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
