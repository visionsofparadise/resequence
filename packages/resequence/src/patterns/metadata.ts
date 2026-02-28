import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import type { TuningConfig } from "../utils/pitch";
import type { PatternNode } from "./pattern";
import { Pattern } from "./pattern";

export interface Metadata {
	readonly name?: string;
	readonly description?: string;
	readonly tuning?: TuningConfig;
	readonly timeSignature?: readonly [number, number];
	readonly marker?: string;
	readonly region?: string;
}

export class MetadataPattern extends Pattern {
	constructor(
		readonly meta: Metadata,
		node: PatternNode,
	) {
		super(node);

		if (meta.timeSignature !== undefined && (meta.timeSignature[0] < 1 || meta.timeSignature[1] < 1)) {
			throw new ResequenceError("INVALID_TIME_SIGNATURE", `timeSignature(): values must be >= 1, got [${meta.timeSignature[0]}, ${meta.timeSignature[1]}]`);
		}
	}

	clone(overrides: Partial<PatternNode>): MetadataPattern {
		return new MetadataPattern(this.meta, this.overrideNode(overrides));
	}

	async setup(context: ScheduleContext): Promise<void> {
		const childContext = this.meta.tuning ? { ...context, tuning: this.meta.tuning } : context;

		for (const { pattern } of this.children) await pattern.setup(childContext);
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (offsetBeats + this.endBeat <= context.fromBeats || offsetBeats + this.startBeat >= context.toBeats) return;

		const childContext = this.meta.tuning ? { ...context, tuning: this.meta.tuning } : context;

		for (const { offsetBeats: childOffset, pattern } of this.children) {
			pattern.schedule(offsetBeats + childOffset, childContext);
		}
	}

	teardown(context: ScheduleContext): void {
		const childContext = this.meta.tuning ? { ...context, tuning: this.meta.tuning } : context;

		for (const { pattern } of this.children) pattern.teardown(childContext);
	}
}

export function metadata(pattern: Pattern, meta: Metadata): MetadataPattern {
	return new MetadataPattern(meta, { notes: [], children: [{ offsetBeats: 0, pattern }], startBeat: pattern.startBeat, endBeat: pattern.endBeat });
}

export const tuning = (pattern: Pattern, config: NonNullable<Metadata["tuning"]>): MetadataPattern => metadata(pattern, { tuning: config });

export const timeSignature = (pattern: Pattern, sig: readonly [number, number]): MetadataPattern => metadata(pattern, { timeSignature: sig });

export const marker = (pattern: Pattern, name: string): MetadataPattern => metadata(pattern, { marker: name });

export const cue = marker;

export const region = (pattern: Pattern, name: string): MetadataPattern => metadata(pattern, { region: name });
