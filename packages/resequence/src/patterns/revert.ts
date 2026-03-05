import type { OptionalProperties } from "../utils/RequiredProperties";
import type { PatternProperties } from "./pattern";
import { ModifierPattern, type ModifierProperties } from "./modifiers/modifier";
import type { Pattern } from "./pattern";
import { descendGraphAndClone } from "../utils/graph";

export interface RevertProperties extends ModifierProperties {
	readonly indexes: ReadonlyArray<number>;
	readonly steps: number;
}

export class RevertPattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "revert"] as const;
	readonly properties: RevertProperties;

	static is(value: unknown): value is RevertPattern {
		return ModifierPattern.is(value) && value.type[3] === "revert";
	}

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
	const reverted = descendGraphAndClone(pattern, { patternIndexes: indexes }, (node) => {
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
