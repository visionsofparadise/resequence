import { Chord } from "tonal";
import { ResequenceError } from "../error";
import type { Duration } from "../utils/duration";
import { resolvePitch } from "../utils/pitch";
import type { LayerPattern } from "./layer";
import { layer } from "./layer";
import { note } from "./note";

const CHORD_REGEX = /^([A-G][#b]?)(\d)(.*)/;

export function chord(name: string | ReadonlyArray<string>, duration: Duration): LayerPattern {
	if (typeof name !== "string") {
		if (name.length === 0) throw new ResequenceError("EMPTY_CHORD", "chord() requires at least one pitch");

		return layer(...name.map((pitch) => note(pitch, duration)));
	}

	const match = CHORD_REGEX.exec(name);

	if (!match) throw new ResequenceError("INVALID_CHORD_NAME", `Invalid chord name: ${name}`);

	const root = match[1];
	const octave = match[2];
	const quality = match[3];

	const chordData = Chord.get(`${root}${quality}`);

	if (chordData.empty) throw new ResequenceError("UNKNOWN_CHORD_QUALITY", `Unknown chord quality: ${name}`);

	const rootMidi = resolvePitch(`${root}${octave}`);

	const notes = chordData.notes.map((pitchClass) => {
		const noteMidi = resolvePitch(`${pitchClass}${octave}`);
		const adjusted = noteMidi < rootMidi ? noteMidi + 12 : noteMidi;

		return note(adjusted, duration);
	});

	return layer(...notes);
}
