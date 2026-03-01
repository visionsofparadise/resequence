import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import type { ResolvedTuning } from "../utils/tuning";
import type { PatternProperties } from "./pattern";
import { Pattern } from "./pattern";

export interface Metadata {
	readonly name?: string;
	readonly description?: string;
	readonly tuning?: ResolvedTuning;
	readonly timeSignature?: readonly [number, number];
	readonly marker?: string;
	readonly region?: string;
}

export interface MetadataProperties extends PatternProperties {
	readonly meta: Metadata;
}

export class MetadataPattern extends Pattern {
	constructor(readonly properties: MetadataProperties) {
		super(properties);

		if (properties.meta.timeSignature !== undefined && (properties.meta.timeSignature[0] < 1 || properties.meta.timeSignature[1] < 1)) {
			throw new ResequenceError("INVALID_TIME_SIGNATURE", `timeSignature(): values must be >= 1, got [${properties.meta.timeSignature[0]}, ${properties.meta.timeSignature[1]}]`);
		}
	}

	clone(overrides: Partial<PatternProperties>): MetadataPattern {
		return new MetadataPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}

	async setup(context: ScheduleContext): Promise<void> {
		const childContext = this.properties.meta.tuning ? { ...context, tuning: this.properties.meta.tuning } : context;

		for (const { pattern } of this.properties.children) await pattern.setup(childContext);
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (offsetBeats + this.properties.endBeat <= context.fromBeats || offsetBeats + this.properties.startBeat >= context.toBeats) return;

		const childContext = this.properties.meta.tuning ? { ...context, tuning: this.properties.meta.tuning } : context;

		for (const { offsetBeats: childOffset, pattern } of this.properties.children) {
			pattern.schedule(offsetBeats + childOffset, childContext);
		}
	}

	teardown(context: ScheduleContext): void {
		const childContext = this.properties.meta.tuning ? { ...context, tuning: this.properties.meta.tuning } : context;

		for (const { pattern } of this.properties.children) pattern.teardown(childContext);
	}
}

export function metadata(pattern: Pattern, meta: Metadata): MetadataPattern {
	return new MetadataPattern({ notes: [], children: [{ offsetBeats: 0, pattern }], startBeat: pattern.startBeat, endBeat: pattern.endBeat, meta });
}

export const tuning = (pattern: Pattern, config: NonNullable<Metadata["tuning"]>): MetadataPattern => metadata(pattern, { tuning: config });

export const timeSignature = (pattern: Pattern, sig: readonly [number, number]): MetadataPattern => metadata(pattern, { timeSignature: sig });

export const marker = (pattern: Pattern, name: string): MetadataPattern => metadata(pattern, { marker: name });

export const cue = marker;

export const region = (pattern: Pattern, name: string): MetadataPattern => metadata(pattern, { region: name });
