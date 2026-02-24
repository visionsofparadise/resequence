import { LayerPattern } from "../patterns/layer";
import { MetadataPattern } from "../patterns/metadata";
import { NotePattern } from "../patterns/note";
import type { Pattern, PositionedNote } from "../patterns/pattern";
import { MidiPattern } from "../patterns/pattern";
import { RepeatPattern } from "../patterns/repeat";
import { SequencePattern } from "../patterns/sequence";
import { PPQ } from "../utils/duration";
import type { MidiNote } from "./encode-midi";
import { encodeMidi } from "./encode-midi";
import { extractMetadata } from "./extract-metadata";

export interface MidiRenderOptions {
	readonly include?: ReadonlyArray<string>;
	readonly exclude?: ReadonlyArray<string>;
	readonly master?: boolean;
}

export interface MidiRenderResult {
	readonly tracks: Map<string, Uint8Array>;
	readonly master?: Uint8Array;
}

export function renderMidi(pattern: Pattern, options?: MidiRenderOptions): MidiRenderResult {
	const meta = extractMetadata(pattern);
	const notes = collectMidi(pattern);
	const grouped = groupByTrack(notes);

	const filteredNames = filterTrackNames([...grouped.keys()], options?.include, options?.exclude);
	const tracks = new Map<string, Uint8Array>();

	for (const name of filteredNames) {
		const trackNotes = grouped.get(name);

		if (!trackNotes || trackNotes.length === 0) continue;

		const singleTrack = new Map([[name, trackNotes]]);
		tracks.set(name, encodeMidi(singleTrack, { ppq: PPQ, tempo: meta.tempo, timeSignature: meta.timeSignature }));
	}

	let master: Uint8Array | undefined;

	if (options?.master) {
		const masterTracks = new Map<string, Array<MidiNote>>();

		for (const name of filteredNames) {
			const trackNotes = grouped.get(name);

			if (trackNotes && trackNotes.length > 0) {
				masterTracks.set(name, trackNotes);
			}
		}

		if (masterTracks.size > 0) {
			master = encodeMidi(masterTracks, { ppq: PPQ, tempo: meta.tempo, timeSignature: meta.timeSignature });
		}
	}

	return { tracks, master };
}

function collectMidi(pattern: Pattern, offsetTicks = 0, inheritedTrackName?: string): ReadonlyArray<PositionedNote> {
	const ownTrack = pattern instanceof MidiPattern && pattern.outputs.length > 0 ? (pattern.outputs[0]?.id ?? undefined) : undefined;
	const trackName = ownTrack ?? inheritedTrackName;

	if (pattern instanceof NotePattern) {
		if (!trackName) return [];
		return [{ tick: offsetTicks, pitch: pattern.notes[0]?.pitch ?? 0, durationTicks: pattern.durationTicks, velocity: pattern.velocity, lyric: pattern.lyric, trackName }];
	}

	if (pattern instanceof SequencePattern) {
		const results: Array<PositionedNote> = [];
		let cursor = offsetTicks;
		for (const child of pattern.children) {
			results.push(...collectMidi(child, cursor, trackName));
			cursor += child.durationTicks;
		}
		return results;
	}

	if (pattern instanceof LayerPattern) {
		const results: Array<PositionedNote> = [];
		for (const child of pattern.children) {
			results.push(...collectMidi(child, offsetTicks, trackName));
		}
		return results;
	}

	if (pattern instanceof RepeatPattern) {
		const results: Array<PositionedNote> = [];
		for (let iteration = 0; iteration < pattern.count; iteration++) {
			results.push(...collectMidi(pattern.child, offsetTicks + pattern.child.durationTicks * iteration, trackName));
		}
		return results;
	}

	if (pattern instanceof MetadataPattern) {
		return collectMidi(pattern.child, offsetTicks, trackName);
	}

	// GapPattern, AudioPattern, AutomatePattern → no notes
	return [];
}

function groupByTrack(notes: ReadonlyArray<PositionedNote>): Map<string, Array<MidiNote>> {
	const grouped = new Map<string, Array<MidiNote>>();

	for (const pn of notes) {
		if (!pn.trackName) continue;

		let track = grouped.get(pn.trackName);

		if (!track) {
			track = [];
			grouped.set(pn.trackName, track);
		}

		track.push({
			tick: pn.tick,
			pitch: pn.pitch,
			durationTicks: pn.durationTicks ?? 0,
			velocity: pn.velocity ?? 100,
			lyric: pn.lyric,
		});
	}

	return grouped;
}

function filterTrackNames(names: ReadonlyArray<string>, include?: ReadonlyArray<string>, exclude?: ReadonlyArray<string>): ReadonlyArray<string> {
	let filtered = [...names];

	if (include && include.length > 0) {
		const includeSet = new Set(include);

		filtered = filtered.filter((name) => includeSet.has(name));
	}

	if (exclude && exclude.length > 0) {
		const excludeSet = new Set(exclude);

		filtered = filtered.filter((name) => !excludeSet.has(name));
	}

	return filtered;
}
