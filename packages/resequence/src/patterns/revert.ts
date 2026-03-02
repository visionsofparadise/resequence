import type { OptionalProperties } from "../utils/RequiredProperties";
import type { PatternProperties } from "./pattern";
import { ModifierPattern, type ModifierProperties } from "./modifiers/modifier";
import type { Pattern } from "./pattern";
import { descendAndClone } from "./utils/tree";

export interface RevertProperties extends ModifierProperties {
	readonly indexes: ReadonlyArray<number>;
	readonly steps: number;
}

export class RevertPattern extends ModifierPattern {
	readonly properties: RevertProperties;

	constructor(properties: OptionalProperties<RevertProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
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
