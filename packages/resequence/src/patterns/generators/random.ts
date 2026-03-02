;
;
import type { Pitch } from "../../utils/pitch";
import type { PatternProperties, RelativeNote } from "../pattern";
import { MidiPattern } from "../midi";
import type { MidiPatternProperties } from "../midi";
import type { OptionalProperties } from "../../utils/RequiredProperties";

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

export interface RandomVelocityRange {
	readonly min: number;
	readonly max: number;
}

export interface RandomOptions {
	readonly pitches: ReadonlyArray<Pitch>;
	readonly count: number;
	readonly stepDuration: number;
	readonly velocity?: RandomVelocityRange;
	readonly seed?: number;
}

export interface RandomProperties extends MidiPatternProperties {
	readonly options: RandomOptions;
}

export class RandomPattern extends MidiPattern {
	readonly type = ["pattern", "midi", "random"] as const;
	readonly properties: RandomProperties;

	static is(value: unknown): value is RandomPattern {
		return MidiPattern.is(value) && value.type[2] === "random";
	}

	constructor(properties: OptionalProperties<RandomProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): RandomPattern {
		return new RandomPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function random(options: RandomOptions): RandomPattern {
	const stepDurationBeats = options.stepDuration;
	const durationBeats = options.count * stepDurationBeats;
	const rng = options.seed !== undefined ? mulberry32(options.seed) : Math.random.bind(Math);
	const resolvedPitches = options.pitches;
	const firstPitch = resolvedPitches[0];

	if (!firstPitch) {
		return new RandomPattern({ notes: [], children: [], startBeat: 0, endBeat: durationBeats, options });
	}

	const notes: Array<RelativeNote> = [];

	for (let stepIndex = 0; stepIndex < options.count; stepIndex++) {
		const pitch = resolvedPitches[Math.floor(rng() * resolvedPitches.length)] ?? firstPitch;
		const minVel = options.velocity?.min ?? 100;
		const maxVel = options.velocity?.max ?? 100;
		const velocity = Math.round(minVel + rng() * (maxVel - minVel));

		notes.push({
			offsetBeats: stepIndex * stepDurationBeats,
			note: { pitch, startBeat: 0, endBeat: stepDurationBeats, velocity },
		});
	}

	return new RandomPattern({ notes, children: [], startBeat: 0, endBeat: durationBeats, options });
}
