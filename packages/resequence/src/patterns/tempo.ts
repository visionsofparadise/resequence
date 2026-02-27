import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import type { ValidateContext } from "../validate";
import type { PositionedAutomation, PositionedMetadata, ScoreNote, TempoKeyframe } from "./pattern";
import { Pattern } from "./pattern";

export interface TempoOptions {
	readonly keyframes?: ReadonlyArray<TempoKeyframe>;
	readonly override?: boolean;
}

export class TempoPattern extends Pattern {
	readonly type = "tempo" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;
	readonly bpm: number;
	readonly keyframes: ReadonlyArray<TempoKeyframe>;
	readonly isOverride: boolean;

	constructor(
		readonly child: Pattern,
		bpm: number,
		options?: TempoOptions,
	) {
		super();

		if (bpm <= 0) {
			throw new ResequenceError("INVALID_TEMPO", `tempo(): bpm must be greater than 0, got ${bpm}`);
		}

		if (options?.keyframes !== undefined) {
			for (const kf of options.keyframes) {
				if (kf.beat < 0) {
					throw new ResequenceError("INVALID_TEMPO", `tempo(): keyframe beat must be >= 0, got ${kf.beat}`);
				}
				if (kf.bpm <= 0) {
					throw new ResequenceError("INVALID_TEMPO", `tempo(): keyframe bpm must be greater than 0, got ${kf.bpm}`);
				}
			}
		}

		this.bpm = bpm;
		this.keyframes = options?.keyframes ?? [];
		this.isOverride = options?.override ?? false;
		this.durationBeats = child.durationBeats;
		this.notes = child.notes;
		this.metadatas = child.metadatas;
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
		this.child.setup(context);
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		this.child.schedule(offsetBeats, context);
	}

	teardown(context: ScheduleContext): void {
		this.child.teardown(context);
	}
}

export function tempo(pattern: Pattern, bpm: number, options?: TempoOptions): TempoPattern {
	return new TempoPattern(pattern, bpm, options);
}
