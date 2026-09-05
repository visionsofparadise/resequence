import { note } from "./note";
import { pitchToMidi } from "./pitch";
import type { Keyframe } from "./events";
import type { Note } from "./note";
import type { Pitch } from "./pitch";

export interface TuningNote extends Pitch {
	(
		duration: number,
		velocityOrOptions?:
			| number
			| {
					velocity?: number;
					lyric?: string;
					cc?: Partial<Record<number, number>>;
					slides?: ReadonlyArray<Keyframe>;
			  },
	): Note;
	readonly hz: number;
	readonly name: string;
	readonly midi: { readonly note: number; readonly bend: number };
}

function createTuningNote(pitch: Pitch, hz: number, name: string): TuningNote {
	const callable = function tuningNote(
		duration: number,
		optionsOrVelocity?:
			| number
			| {
					velocity?: number;
					lyric?: string;
					cc?: Partial<Record<number, number>>;
					slides?: ReadonlyArray<Keyframe>;
			  },
	): Note {
		const options = typeof optionsOrVelocity === "number" ? { velocity: optionsOrVelocity } : optionsOrVelocity;

		return note(callable, duration, options);
	} as TuningNote;

	Object.defineProperty(callable, "name", { value: name, writable: false, configurable: true });

	return Object.assign(callable, {
		class: pitch.class,
		stepsPerOctave: pitch.stepsPerOctave,
		octave: pitch.octave,
		octaveRatio: pitch.octaveRatio,
		hz,
		midi: pitchToMidi(pitch),
	});
}

export interface EqualTuningInput<C extends ReadonlyArray<string> = ReadonlyArray<string>> {
	readonly classes: C;
	readonly reference: { readonly class: NoInfer<C[number]>; readonly octave: number; readonly hz: number };
	readonly octaveRatio?: number;
	readonly octaveRange?: readonly [number, number];
}

export interface FrequencyTuningInput<F extends Record<string, number> = Record<string, number>> {
	readonly frequencies: F;
	readonly referenceOctave: number;
	readonly octaveRatio?: number;
	readonly octaveRange?: readonly [number, number];
}

export interface ResolvedTuning {
	readonly classes: ReadonlyArray<string>;
	readonly frequencies: Readonly<Record<string, number>>;
	readonly octaveRatio: number;
	readonly referenceOctave: number;
}

type OctaveDigit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type TuningKeys<C extends string, Oct extends number = OctaveDigit> = `${C}${Oct}`;

export type Tuning<C extends string> = {
	readonly [K in TuningKeys<C>]: TuningNote;
} & {
	readonly config: ResolvedTuning;
};

export function createTuning<const C extends ReadonlyArray<string>>(config: EqualTuningInput<C>): Tuning<C[number]>;
export function createTuning<const F extends Record<string, number>>(
	config: FrequencyTuningInput<F>,
): Tuning<Extract<keyof F, string>>;
export function createTuning(config: EqualTuningInput | FrequencyTuningInput): Tuning<string> {
	if ("classes" in config) {
		return createEqualTuning(config);
	}

	return createFrequencyTuning(config);
}

function buildTuningNamespace(resolved: ResolvedTuning, octaveRange: readonly [number, number]): Tuning<string> {
	const { classes, frequencies, octaveRatio, referenceOctave } = resolved;
	const stepsPerOctave = classes.length;
	const namespace: Record<string, TuningNote> = {};

	for (let octave = octaveRange[0]; octave <= octaveRange[1]; octave++) {
		for (const [classIndex, className] of classes.entries()) {
			const key = `${className}${octave}`;
			const pitch: Pitch = { class: classIndex, stepsPerOctave, octave, octaveRatio };
			const baseHz = frequencies[className] ?? 0;
			const hz = baseHz * Math.pow(octaveRatio, octave - referenceOctave);

			namespace[key] = createTuningNote(pitch, hz, key);
		}
	}

	return Object.assign(namespace, { config: resolved });
}

function createEqualTuning(config: EqualTuningInput): Tuning<string> {
	const { classes, octaveRatio = 2, reference, octaveRange = [0, 9] } = config;
	const spo = classes.length;
	const refClassIndex = classes.indexOf(reference.class);

	if (refClassIndex === -1) {
		throw new Error(`Reference class '${reference.class}' not found in classes`);
	}

	const frequencies: Record<string, number> = {};

	for (const [ci, className] of classes.entries()) {
		frequencies[className] = reference.hz * Math.pow(octaveRatio, (ci - refClassIndex) / spo);
	}

	const resolved: ResolvedTuning = {
		classes: [...classes],
		frequencies,
		octaveRatio,
		referenceOctave: reference.octave,
	};

	return buildTuningNamespace(resolved, octaveRange);
}

function createFrequencyTuning(config: FrequencyTuningInput): Tuning<string> {
	const { frequencies: freqInput, referenceOctave, octaveRatio = 2, octaveRange = [0, 9] } = config;

	const sorted = Object.entries(freqInput).sort((ea, eb) => ea[1] - eb[1]);
	const classes = sorted.map(([name]) => name);
	const frequencies: Record<string, number> = {};

	for (const [name, hz] of sorted) {
		frequencies[name] = hz;
	}

	const resolved: ResolvedTuning = {
		classes,
		frequencies,
		octaveRatio,
		referenceOctave,
	};

	return buildTuningNamespace(resolved, octaveRange);
}

export function addAliases<C extends string, A extends string>(
	tuning: Tuning<C>,
	aliases: { readonly [K in A]: string | readonly [target: string, octaveOffset: number] },
): Tuning<C | A> {
	const ns = tuning as unknown as Record<string, TuningNote>;
	const [minOctave, maxOctave] = getOctaveRange(ns);

	for (const [alias, target] of Object.entries<string | readonly [string, number]>(aliases)) {
		const [targetName, octaveOffset] = typeof target === "string" ? ([target, 0] as const) : target;

		for (let octave = minOctave; octave <= maxOctave; octave++) {
			const targetOctave = octave + octaveOffset;
			const entry = ns[`${targetName}${targetOctave}`];

			if (entry) ns[`${alias}${octave}`] = entry;
		}
	}

	return tuning as unknown as Tuning<C | A>;
}

export function createIndexTuning(count: number): (index: number) => TuningNote {
	const spo = count;
	const cache: Array<TuningNote> = [];

	return function I(index: number): TuningNote {
		let entry = cache[index];

		if (!entry) {
			const pitch: Pitch = { class: index, stepsPerOctave: spo, octave: 0, octaveRatio: 2 };

			entry = createTuningNote(pitch, 0, `${index}`);
			cache[index] = entry;
		}

		return entry;
	};
}

function getOctaveRange(ns: Record<string, unknown>): [number, number] {
	let min = Infinity;
	let max = -Infinity;

	for (const key of Object.keys(ns)) {
		const match = /(-?\d+)$/.exec(key);

		if (match) {
			const oct = parseInt(match[1] ?? "", 10);

			if (oct < min) min = oct;

			if (oct > max) max = oct;
		}
	}

	return [min, max];
}
