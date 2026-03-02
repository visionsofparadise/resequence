import type { OptionalProperties } from "../utils/RequiredProperties";
import type { Pattern, PatternProperties } from "./pattern";
import { ModifierPattern, type ModifierProperties } from "./modifiers/modifier";
import { descendAndClone } from "./utils/tree";

export type OverrideCallback = (properties: PatternProperties) => Partial<PatternProperties>;

export interface OverrideProperties extends ModifierProperties {
	readonly indexes: ReadonlyArray<number>;
	readonly callback: OverrideCallback;
}

export class OverridePattern extends ModifierPattern {
	readonly properties: OverrideProperties;

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
