import type { BaseEvent } from "../events";
import type { PatternProperties } from "./pattern";
import { Pattern } from "./pattern";

export interface CustomPatternProperties extends PatternProperties {
	readonly onSetup?: (absoluteBeat: number) => Array<BaseEvent>;
	readonly onSchedule?: (absoluteBeat: number) => Array<BaseEvent>;
	readonly onTeardown?: (absoluteBeat: number) => Array<BaseEvent>;
}

export class CustomPattern extends Pattern<CustomPatternProperties> {
	override _setup(absoluteBeat: number): Array<BaseEvent> {
		return this.properties.onSetup?.(absoluteBeat) ?? [];
	}

	override _schedule(absoluteBeat: number): Array<BaseEvent> {
		return this.properties.onSchedule?.(absoluteBeat) ?? [];
	}

	override _teardown(absoluteBeat: number): Array<BaseEvent> {
		return this.properties.onTeardown?.(absoluteBeat) ?? [];
	}

	clone(overrides: Partial<PatternProperties>): CustomPattern {
		return new CustomPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function custom(options: {
	setup?: (absoluteBeat: number) => Array<BaseEvent>;
	schedule?: (absoluteBeat: number) => Array<BaseEvent>;
	teardown?: (absoluteBeat: number) => Array<BaseEvent>;
	durationBeats?: number;
}): CustomPattern {
	return new CustomPattern({
		notes: [],
		children: [],
		startBeat: 0,
		endBeat: options.durationBeats ?? 0,
		onSetup: options.setup,
		onSchedule: options.schedule,
		onTeardown: options.teardown,
	});
}
