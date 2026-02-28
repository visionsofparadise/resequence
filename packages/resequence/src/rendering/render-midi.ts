import type { ScoreNote } from "../patterns/note";
import type { Pattern } from "../patterns/pattern";
import type { MidiUnit } from "../units/midi-unit";
import { PPQ } from "../utils/duration";
import { pitchToMidi } from "../utils/pitch";
import { evaluateSlideCents } from "../utils/slide";
import { collectMarkers } from "./collect-markers";
import { collectTimeSignatures } from "./collect-time-signatures";
import type { MidiNote, MidiPitchBend } from "./encode-midi";
import { encodeMidi } from "./encode-midi";
import type { ScheduleContext } from "./schedule-context";
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
	// FIX: All of these could be gathered in a single walk
	const tempoChanges = buildTempoMap(pattern);
	const timeSignatureChanges = collectTimeSignatures(pattern);
	const markers = collectMarkers(pattern);
	const grouped = collectMidiNotes(pattern, tempoChanges);

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

function collectMidiNotes(pattern: Pattern, tempoMap: ReadonlyArray<{ beat: number; bpm: number }>): Map<string, Array<MidiNote>> {
	const grouped = new Map<string, Array<MidiNote>>();

	const context: ScheduleContext = {
		audioContext: undefined as unknown as BaseAudioContext,
		sampleMap: new Map(),
		driverMap: new Map(),
		tempoMap,
		fromBeats: 0,
		toBeats: pattern.endBeat - pattern.startBeat,
		outputs: [],
		getSample: () => Promise.reject(new Error("No audio context in MIDI render")),
		loadModule: () => Promise.reject(new Error("No audio context in MIDI render")),
		dispatch: (note: ScoreNote, offsetBeats: number, outputs: ReadonlyArray<MidiUnit>) => {
			addNoteToTracks(note, offsetBeats, outputs, grouped);
		},
	};

	pattern.schedule(0, context);

	return grouped;
}

function addNoteToTracks(scoreNote: ScoreNote, offsetBeats: number, outputs: ReadonlyArray<MidiUnit>, grouped: Map<string, Array<MidiNote>>): void {
	const absoluteBeat = offsetBeats + scoreNote.startBeat;
	const durationBeats = scoreNote.endBeat - scoreNote.startBeat;

	for (const output of outputs) {
		const trackName = output.id ?? "unknown";

		let track = grouped.get(trackName);
		if (!track) {
			track = [];
			grouped.set(trackName, track);
		}

		const { note: midiNote, bend } = pitchToMidi(scoreNote.pitch);

		let pitchBends: ReadonlyArray<MidiPitchBend> | undefined;

		if (scoreNote.slides && scoreNote.slides.length > 0) {
			const noteTick = Math.round(absoluteBeat * PPQ);
			const durationTicks = Math.round(durationBeats * PPQ);
			const sampleInterval = 10;
			const bends: Array<MidiPitchBend> = [];

			for (let tickOffset = 0; tickOffset <= durationTicks; tickOffset += sampleInterval) {
				const beatOffset = tickOffset / PPQ;
				const slideCents = evaluateSlideCents(scoreNote.pitch, scoreNote.slides, beatOffset);
				const totalCents = (bend || 0) + slideCents;
				bends.push({ tick: noteTick + tickOffset, bend: totalCents });
			}

			pitchBends = bends;
		}

		track.push({
			tick: Math.round(absoluteBeat * PPQ),
			note: midiNote,
			bend: !pitchBends && bend !== 0 ? bend : undefined,
			durationTicks: Math.round(durationBeats * PPQ),
			velocity: scoreNote.velocity,
			lyric: scoreNote.lyric,
			cc: scoreNote.cc,
			pitchBends,
		});
	}
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
