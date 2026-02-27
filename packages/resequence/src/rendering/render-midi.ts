import type { Pattern } from "../patterns/pattern";
import { PPQ } from "../utils/duration";
import { pitchToMidi } from "../utils/pitch";
import { evaluateSlideCents } from "../utils/slide";
import { collectMarkers } from "./collect-markers";
import type { MidiNote, MidiPitchBend } from "./encode-midi";
import { encodeMidi } from "./encode-midi";
import { collectTimeSignatures } from "./collect-time-signatures";
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
	const tempoChanges = buildTempoMap(pattern);
	const timeSignatureChanges = collectTimeSignatures(pattern.metadatas);
	const markers = collectMarkers(pattern);
	const grouped = groupByTrack(pattern);

	const filteredNames = filterTrackNames([...grouped.keys()], options?.include, options?.exclude);
	const tracks = new Map<string, Uint8Array>();

	for (const name of filteredNames) {
		const trackNotes = grouped.get(name);

		if (!trackNotes || trackNotes.length === 0) continue;

		const singleTrack = new Map([[name, trackNotes]]);
		tracks.set(name, encodeMidi(singleTrack, { ppq: PPQ, tempoChanges, timeSignatureChanges, markers }));
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
			master = encodeMidi(masterTracks, { ppq: PPQ, tempoChanges, timeSignatureChanges, markers });
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

			const { note: midiNote, bend } = pitchToMidi(pn.pitch);

			let pitchBends: ReadonlyArray<MidiPitchBend> | undefined;

			if (pn.slides && pn.slides.length > 0) {
				const noteTick = Math.round(pn.beat * PPQ);
				const durationTicks = Math.round((pn.durationBeats ?? 0) * PPQ);
				const sampleInterval = 10;
				const bends: Array<MidiPitchBend> = [];

				for (let tickOffset = 0; tickOffset <= durationTicks; tickOffset += sampleInterval) {
					const beatOffset = tickOffset / PPQ;
					const slideCents = evaluateSlideCents(pn.pitch, pn.slides, beatOffset);
					const totalCents = (bend || 0) + slideCents;
					bends.push({ tick: noteTick + tickOffset, bend: totalCents });
				}

				pitchBends = bends;
			}

			track.push({
				tick: Math.round(pn.beat * PPQ),
				note: midiNote,
				bend: !pitchBends && bend !== 0 ? bend : undefined,
				durationTicks: Math.round((pn.durationBeats ?? 0) * PPQ),
				velocity: pn.velocity ?? 100,
				lyric: pn.lyric,
				cc: pn.cc,
				pitchBends,
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
