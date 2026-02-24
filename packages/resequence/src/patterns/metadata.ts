import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";

export class MetadataPattern implements Pattern {
	readonly type = "metadata" as const;
	readonly durationTicks: number;

	constructor(
		readonly node: Pattern,
		readonly tempo?: number,
		readonly key?: string,
		readonly timeSignature?: [number, number],
	) {
		if (tempo !== undefined && tempo <= 0) {
			throw new ResequenceError("INVALID_TEMPO", `metadata(): tempo must be greater than 0, got ${tempo}`);
		}

		if (timeSignature !== undefined) {
			const [numerator, denominator] = timeSignature;
			if (numerator <= 0 || !Number.isInteger(numerator) || denominator <= 0 || !Number.isInteger(denominator)) {
				throw new ResequenceError("INVALID_TIME_SIGNATURE", `metadata(): time signature values must be positive integers, got [${numerator}, ${denominator}]`);
			}
		}

		this.durationTicks = node.durationTicks;
	}

	transpose(interval: number): MetadataPattern {
		return new MetadataPattern(this.node.transpose(interval), this.tempo, this.key, this.timeSignature);
	}

	reverse(): MetadataPattern {
		return new MetadataPattern(this.node.reverse(), this.tempo, this.key, this.timeSignature);
	}

	getMidi(offset = 0, trackName?: string): Array<PositionedNote> {
		return this.node.getMidi(offset, trackName);
	}

	validate(context: ValidateContext): void {
		this.node.validate(context);
	}

	setup(context: ScheduleContext): void {
		this.node.setup(context);
	}

	prepare(offsetTicks: number, context: ScheduleContext): void {
		this.node.prepare(offsetTicks, context);
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		this.node.schedule(offsetTicks, context);
	}

	teardown(context: ScheduleContext): void {
		this.node.teardown(context);
	}
}

export function metadata(pattern: Pattern, config: { tempo?: number; key?: string; timeSignature?: [number, number] }): MetadataPattern {
	return new MetadataPattern(pattern, config.tempo, config.key, config.timeSignature);
}
