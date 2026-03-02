import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { Pattern, PatternProperties } from "../pattern";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export class SkipPattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "skip"] as const;
	readonly properties: ModifierProperties;

	static is(value: unknown): value is SkipPattern {
		return ModifierPattern.is(value) && value.type[3] === "skip";
	}

	constructor(properties: OptionalProperties<ModifierProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	setup(): Promise<void> {
		return Promise.resolve();
	}

	schedule(): void {
		return;
	}

	clone(overrides: Partial<PatternProperties>): SkipPattern {
		return new SkipPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function skip(pattern: Pattern): SkipPattern {
	return new SkipPattern({
		notes: [],
		children: [],
		startBeat: 0,
		endBeat: 0,
		input: pattern,
	});
}
