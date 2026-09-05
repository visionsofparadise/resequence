import { Scale } from "tonal";
import { resolveTonalNote } from "./resolveTonalNote";
import type { TuningNote } from "@resequence/patterns-core";

export type ScaleAccessor = (degree: number, octave?: number) => TuningNote;

const SCALE_REGEX = /^([A-G][#b]?)(\d)\s+(.+)/;

export function CS(name: string): ScaleAccessor {
	const match = SCALE_REGEX.exec(name) as [string, string, string, string] | null;

	if (!match) throw new Error(`Invalid scale name: ${name}`);

	const [, root, octaveStr, scaleType] = match;
	const rootOctave = parseInt(octaveStr, 10);

	const scaleData = Scale.get(`${root} ${scaleType}`);

	if (scaleData.empty) throw new Error(`Unknown scale: ${name}`);

	const pitchClasses = scaleData.notes;

	return (degree: number, octave?: number): TuningNote => {
		const length = pitchClasses.length;
		const zeroBased = degree > 0 ? degree - 1 : degree;
		const index = ((zeroBased % length) + length) % length;
		const octaveOffset = Math.floor(zeroBased / length);

		const pitchClass = pitchClasses[index] ?? "C";
		const resolvedOctave = octave ?? rootOctave + octaveOffset;

		const resolved = resolveTonalNote(pitchClass, resolvedOctave);

		if (!resolved) throw new Error(`Cannot resolve scale note: ${pitchClass}${resolvedOctave}`);

		return resolved;
	};
}
