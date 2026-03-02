import type { ScheduleContext } from "../rendering/schedule-context";
import type { ValidateContext } from "../validate";
import type { ScoreNote } from "./note";

export interface RelativeNote {
	readonly offsetBeats: number;
	readonly note: ScoreNote;
}

export interface RelativeChild {
	readonly offsetBeats: number;
	readonly pattern: Pattern;
}

export interface PatternProperties {
	readonly notes: ReadonlyArray<RelativeNote>;
	readonly children: ReadonlyArray<RelativeChild>;
	readonly startBeat: number;
	readonly endBeat: number;
	readonly previousProperties?: PatternProperties;
}

export abstract class Pattern {
	abstract readonly type: ReadonlyArray<string>;

	constructor(readonly properties: PatternProperties) {}

	static is(value: unknown): value is Pattern {
		return typeof value === "object" && value !== null && "type" in value && Array.isArray(value.type) && value.type[0] === "pattern";
	}

	get notes(): ReadonlyArray<RelativeNote> {
		return this.properties.notes;
	}

	get children(): ReadonlyArray<RelativeChild> {
		return this.properties.children;
	}

	get startBeat(): number {
		return this.properties.startBeat;
	}

	get endBeat(): number {
		return this.properties.endBeat;
	}

	async setup(context: ScheduleContext): Promise<void> {
		if (this.properties.children.length === 0) return;

		await Promise.allSettled(this.properties.children.map(({ pattern }) => pattern.setup(context)));
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (offsetBeats + this.properties.endBeat <= context.fromBeats || offsetBeats + this.properties.startBeat >= context.toBeats) return;

		for (const { offsetBeats: childOffset, pattern } of this.properties.children) {
			pattern.schedule(offsetBeats + childOffset, context);
		}
	}

	validate(context: ValidateContext): void {
		for (const { pattern } of this.properties.children) {
			pattern.validate(context);
		}
	}

	teardown(context: ScheduleContext): void {
		for (const { pattern } of this.properties.children) pattern.teardown(context);
	}

	abstract clone(overrides: Partial<PatternProperties>): Pattern;
}
