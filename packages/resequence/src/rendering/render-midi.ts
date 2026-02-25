import type { Pattern } from "../patterns/pattern";
import { PPQ } from "../utils/duration";
import { collectMarkers } from "./collect-markers";
import type { MidiNote } from "./encode-midi";
import { encodeMidi } from "./encode-midi";
import { buildTempoMap } from "./tempo-map";

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
	const tempoChanges = buildTempoMap(pattern); // FIX: We already created the tempo map in the caller
	const markers = collectMarkers(pattern);
	const grouped = groupByTrack(pattern);

	const filteredNames = filterTrackNames([...grouped.keys()], options?.include, options?.exclude);
	const tracks = new Map<string, Uint8Array>();

	for (const name of filteredNames) {
		const trackNotes = grouped.get(name);

		if (!trackNotes || trackNotes.length === 0) continue;

		const singleTrack = new Map([[name, trackNotes]]);
		tracks.set(name, encodeMidi(singleTrack, { ppq: PPQ, tempoChanges, markers }));
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
			master = encodeMidi(masterTracks, { ppq: PPQ, tempoChanges, markers });
		}
	}

	return { tracks, master };
}

function groupByTrack(pattern: Pattern): Map<string, Array<MidiNote>> {
	const grouped = new Map<string, Array<MidiNote>>();

	for (const pn of pattern.notes) {
		for (const outputId of pn.outputs) {
			const trackName = outputId ?? "unknown";

			let track = grouped.get(trackName);

			if (!track) {
				track = [];
				grouped.set(trackName, track);
			}

			track.push({
				tick: pn.tick,
				pitch: pn.pitch,
				durationTicks: pn.durationTicks ?? 0,
				velocity: pn.velocity ?? 100,
				lyric: pn.lyric,
				cc: pn.cc,
			});
		}
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
