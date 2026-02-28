;
;
import type { Pitch } from "../../utils/pitch";
import type { PatternNode, RelativeNote } from "../pattern";
import { MidiPattern } from "../pattern";

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

export class RandomPattern extends MidiPattern {
	constructor(
		readonly options: RandomOptions,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): RandomPattern {
		return new RandomPattern(this.options, this.overrideNode(overrides));
	}
}

export function random(options: RandomOptions): RandomPattern {
	const stepDurationBeats = options.stepDuration;
	const durationBeats = options.count * stepDurationBeats;
	const rng = options.seed !== undefined ? mulberry32(options.seed) : Math.random.bind(Math);
	const resolvedPitches = options.pitches;
	const firstPitch = resolvedPitches[0];

	if (!firstPitch) {
		return new RandomPattern(options, { notes: [], children: [], startBeat: 0, endBeat: durationBeats });
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

	return new RandomPattern(options, { notes, children: [], startBeat: 0, endBeat: durationBeats });
}
