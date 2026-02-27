import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import type { ValidateContext } from "../validate";
import type { Metadata, PositionedAutomation, PositionedMetadata, ScoreNote } from "./pattern";
import { Pattern } from "./pattern";

export class MetadataPattern extends Pattern {
	readonly type = "metadata" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly meta: Metadata,
	) {
		super();
		if (meta.timeSignature !== undefined && (meta.timeSignature[0] < 1 || meta.timeSignature[1] < 1)) {
			throw new ResequenceError("INVALID_TIME_SIGNATURE", `timeSignature(): values must be >= 1, got [${meta.timeSignature[0]}, ${meta.timeSignature[1]}]`);
		}

		this.durationBeats = child.durationBeats;
		this.notes = child.notes;
		this.metadatas = [{ beat: 0, meta }, ...child.metadatas];
		this.automations = child.automations;
	}

	get sampleKeys(): ReadonlySet<string> {
		return this.child.sampleKeys;
	}

	get moduleUrls(): ReadonlySet<string> {
		return this.child.moduleUrls;
	}

	validate(context: ValidateContext): void {
		this.child.validate(context);
	}

	setup(context: ScheduleContext): void {
		this.child.setup(this.meta.tuning ? { ...context, tuning: this.meta.tuning } : context);
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		this.child.schedule(offsetBeats, this.meta.tuning ? { ...context, tuning: this.meta.tuning } : context);
	}

	teardown(context: ScheduleContext): void {
		this.child.teardown(this.meta.tuning ? { ...context, tuning: this.meta.tuning } : context);
	}
}

export function metadata(pattern: Pattern, meta: Metadata): MetadataPattern {
	return new MetadataPattern(pattern, meta);
}

export const tuning = (pattern: Pattern, config: NonNullable<Metadata["tuning"]>): MetadataPattern => metadata(pattern, { tuning: config });
export const timeSignature = (pattern: Pattern, sig: readonly [number, number]): MetadataPattern => metadata(pattern, { timeSignature: sig });
export const marker = (pattern: Pattern, name: string): MetadataPattern => metadata(pattern, { marker: name });
export const cue = marker;
export const region = (pattern: Pattern, name: string): MetadataPattern => metadata(pattern, { region: name });
