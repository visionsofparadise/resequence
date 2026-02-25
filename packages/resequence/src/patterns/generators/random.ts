import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { Pitch } from "../../utils/pitch";
import { resolvePitch } from "../../utils/pitch";
import type { ValidateContext } from "../../validate";
import type { PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export interface RandomVelocityRange {
	readonly min: number;
	readonly max: number;
}

export interface RandomOptions {
	readonly pitches: ReadonlyArray<string | number | Pitch>;
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
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(readonly options: RandomOptions) {
		super();

		const stepDurationBeats = resolveDuration(options.stepDuration);
		this.durationBeats = options.count * stepDurationBeats;

		const rng = options.seed !== undefined ? mulberry32(options.seed) : Math.random.bind(Math);
		const result: Array<PositionedNote> = [];
		const firstRaw = options.pitches[0];

		if (firstRaw === undefined) {
			this.notes = result;
			return;
		}

		const resolvedPitches = options.pitches.map(resolvePitch);
		const firstPitch = resolvePitch(firstRaw);

		for (let stepIndex = 0; stepIndex < options.count; stepIndex++) {
			const pitch = resolvedPitches[Math.floor(rng() * resolvedPitches.length)] ?? firstPitch;
			const minVel = options.velocity?.min ?? 100;
			const maxVel = options.velocity?.max ?? 100;
			const velocity = Math.round(minVel + rng() * (maxVel - minVel));

			result.push({
				beat: stepIndex * stepDurationBeats,
				pitch,
				durationBeats: stepDurationBeats,
				velocity,
				outputs: [],
			});
		}

		this.notes = result;
	}

	validate(_context: ValidateContext): void {
		return;
	}

	prepare(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		prepareNotes(this.notes, offsetBeats, this.outputs, context);
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		scheduleNotes(this.notes, offsetBeats, this.outputs, context);
	}
}

export function random(options: RandomOptions): RandomPattern {
	return new RandomPattern(options);
}
