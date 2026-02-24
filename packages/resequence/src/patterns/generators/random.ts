import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export interface RandomVelocityRange {
	readonly min: number;
	readonly max: number;
}

export interface RandomOptions {
	readonly pitches: ReadonlyArray<number>;
	readonly count: number;
	readonly stepDuration: Duration | number;
	readonly velocity?: RandomVelocityRange;
	readonly seed?: number;
}

function mulberry32(seed: number): () => number {
	let state = seed;

	return function (): number {
		state += 0x6d2b79f5;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

export class RandomPattern extends MidiPattern {
	readonly type = "random" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(readonly options: RandomOptions) {
		super();

		const stepDurationTicks = resolveDuration(options.stepDuration);
		this.durationTicks = options.count * stepDurationTicks;

		const rng = options.seed !== undefined ? mulberry32(options.seed) : Math.random.bind(Math);
		const result: Array<PositionedNote> = [];
		const firstPitch = options.pitches[0];

		if (firstPitch === undefined) {
			this.notes = result;
			return;
		}

		for (let stepIndex = 0; stepIndex < options.count; stepIndex++) {
			const pitch = options.pitches[Math.floor(rng() * options.pitches.length)] ?? firstPitch;
			const minVel = options.velocity?.min ?? 100;
			const maxVel = options.velocity?.max ?? 100;
			const velocity = Math.round(minVel + rng() * (maxVel - minVel));

			result.push({
				tick: stepIndex * stepDurationTicks,
				pitch,
				durationTicks: stepDurationTicks,
				velocity,
			});
		}

		this.notes = result;
	}

	validate(_context: ValidateContext): void {
		return;
	}

	prepare(offsetTicks: number, context: ScheduleContext): void {
		if (!isInScope(offsetTicks, this.durationTicks, context)) return;

		prepareNotes(this.notes, offsetTicks, this.outputs, context);
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (!isInScope(offsetTicks, this.durationTicks, context)) return;

		scheduleNotes(this.notes, offsetTicks, this.outputs, context);
	}
}

export function random(options: RandomOptions): RandomPattern {
	return new RandomPattern(options);
}
