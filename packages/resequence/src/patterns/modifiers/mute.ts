import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { Pattern, PatternProperties } from "../pattern";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export class MutePattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "mute"] as const;
	readonly properties: ModifierProperties;

	static is(value: unknown): value is MutePattern {
		return ModifierPattern.is(value) && value.type[3] === "mute";
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

	clone(overrides: Partial<PatternProperties>): MutePattern {
		return new MutePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function mute(pattern: Pattern): MutePattern {
	return new MutePattern({
		notes: [],
		children: [],
		startBeat: pattern.startBeat,
		endBeat: pattern.endBeat,
		input: pattern,
	});
}
