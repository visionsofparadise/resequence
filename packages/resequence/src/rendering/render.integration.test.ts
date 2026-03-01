import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseMidi } from "midi-file";
import { describe, beforeAll, it, expect } from "vitest";
import { N } from "../tunings/chromatic";
import { layer } from "../patterns/layer";
import { sequence } from "../patterns/sequence";
import { repeat } from "../patterns/modifiers/repeat";
import { transpose } from "../patterns/modifiers/transpose";
import { tempo } from "../patterns/tempo";
import { marker } from "../patterns/metadata";
import { timeSignature } from "../patterns/metadata";
import { oscillator } from "../units/generators/oscillator";
import { gain } from "../units/effects/gain";
import { lowpass } from "../units/effects/filter";
import { out } from "../units/effects/out";
import { chorus } from "../units/effects/chorus";
import { reverb } from "../units/effects/reverb";
import { delay } from "../units/effects/delay";
import { mix } from "../units/effects/mix";
import { pan } from "../units/effects/pan";
import { compressor } from "../units/effects/compressor";
import { collectMetadata } from "./pattern-metadata";
import { renderAudio } from "./render-audio";
import { renderMidi } from "./render-midi";
import { encodeWav } from "./encode-wav";
import { beatsToSeconds } from "./tempo-map";

const OUT_DIR = resolve(__dirname, "../../../test-output");

async function getOfflineAudioContext(channels: number, lengthSeconds: number, sampleRate: number): Promise<OfflineAudioContext> {
	const { default: nodeWebAudio } = (await import("node-web-audio-api")) as { default: { OfflineAudioContext: typeof OfflineAudioContext } };
	return new nodeWebAudio.OfflineAudioContext(channels, Math.ceil(lengthSeconds * sampleRate), sampleRate);
}

function hasAudio(buffer: AudioBuffer): boolean {
	for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
		const data = buffer.getChannelData(ch);
		for (let i = 0; i < data.length; i++) {
			if (data[i] !== 0) return true;
		}
	}
	return false;
}

function writeWav(name: string, buffer: AudioBuffer, subdir?: string): void {
	const dir = subdir ? resolve(OUT_DIR, subdir) : OUT_DIR;
	mkdirSync(dir, { recursive: true });
	const wav = encodeWav(buffer);
	writeFileSync(resolve(dir, `${name}.wav`), Buffer.from(wav));
}

function writeMid(name: string, data: Uint8Array, subdir?: string): void {
	const dir = subdir ? resolve(OUT_DIR, subdir) : OUT_DIR;
	mkdirSync(dir, { recursive: true });
	writeFileSync(resolve(dir, `${name}.mid`), data);
}

const noopFetch = (): Promise<ArrayBuffer> => Promise.reject(new Error("No samples in synth tests"));

describe("render integration", () => {
	beforeAll(() => {
		mkdirSync(OUT_DIR, { recursive: true });
	});

	describe("synth composition → audio stems + master", () => {
		const bass = oscillator({ type: "sawtooth", id: "bass" });
		const bassFilter = lowpass({ frequency: 400 });
		const bassGain = gain({ level: -6 });
		bass.to(bassFilter);
		bassFilter.to(bassGain);
		bassGain.to(out());

		const lead = oscillator({ type: "triangle", id: "lead" });
		const leadGain = gain({ level: -12 });
		lead.to(leadGain);
		leadGain.to(out());

		const bassLine = sequence(N.C2(1), N.E2(1), N.G2(1), N.C3(1));
		const leadLine = sequence(N.E4(0.5), N.G4(0.5), N.B4(0.5), N.C5(0.5), N.B4(1), N.G4(1));

		const pattern = tempo(layer(
			bassLine.route(bass),
			leadLine.route(lead),
		), 120);

		const metadata = collectMetadata(pattern);
		const totalSeconds = beatsToSeconds(pattern.endBeat - pattern.startBeat, metadata.tempoMap);
		const sampleRate = 44100;

		let bassStemBuffer: AudioBuffer;
		let leadStemBuffer: AudioBuffer;
		let masterBuffer: AudioBuffer;

		beforeAll(async () => {
			const bassCtx = await getOfflineAudioContext(2, totalSeconds, sampleRate);
			const bassResult = await renderAudio(pattern, bassCtx, noopFetch, {
				trackFilter: new Set(["bass"]),
				metadata,
			});
			bassStemBuffer = bassResult.buffer;
			writeWav("bass", bassStemBuffer, "audio-stems");

			const leadCtx = await getOfflineAudioContext(2, totalSeconds, sampleRate);
			const leadResult = await renderAudio(pattern, leadCtx, noopFetch, {
				trackFilter: new Set(["lead"]),
				metadata,
			});
			leadStemBuffer = leadResult.buffer;
			writeWav("lead", leadStemBuffer, "audio-stems");

			const masterCtx = await getOfflineAudioContext(2, totalSeconds, sampleRate);
			const masterResult = await renderAudio(pattern, masterCtx, noopFetch, { metadata });
			masterBuffer = masterResult.buffer;
			writeWav("master", masterBuffer, "audio-stems");
		});

		it("bass stem has audio", () => {
			expect(hasAudio(bassStemBuffer)).toBe(true);
		});

		it("lead stem has audio", () => {
			expect(hasAudio(leadStemBuffer)).toBe(true);
		});

		it("master has audio", () => {
			expect(hasAudio(masterBuffer)).toBe(true);
		});

		it("stems differ from each other", () => {
			const bassData = bassStemBuffer.getChannelData(0);
			const leadData = leadStemBuffer.getChannelData(0);
			let different = false;
			for (let i = 0; i < bassData.length; i++) {
				if (bassData[i] !== leadData[i]) {
					different = true;
					break;
				}
			}
			expect(different).toBe(true);
		});
	});

	describe("synth composition → MIDI stems + master", () => {
		const bass = oscillator({ type: "sawtooth", id: "bass" });
		const lead = oscillator({ type: "triangle", id: "lead" });

		const bassLine = sequence(N.C2(1), N.E2(1), N.G2(1), N.C3(1));
		const leadLine = sequence(N.E4(0.5), N.G4(0.5), N.B4(0.5), N.C5(0.5), N.B4(1), N.G4(1));

		const pattern = tempo(layer(
			bassLine.route(bass),
			leadLine.route(lead),
		), 120);

		let stemResult: { tracks: Map<string, Uint8Array>; master?: Uint8Array };
		let masterResult: { tracks: Map<string, Uint8Array>; master?: Uint8Array };

		beforeAll(() => {
			stemResult = renderMidi(pattern);
			masterResult = renderMidi(pattern, { master: true });

			for (const [name, data] of stemResult.tracks) {
				writeMid(name, data, "midi-stems");
			}

			if (masterResult.master) {
				writeMid("master", masterResult.master, "midi-stems");
			}
		});

		it("produces two track stems", () => {
			expect(stemResult.tracks.size).toBe(2);
			expect(stemResult.tracks.has("bass")).toBe(true);
			expect(stemResult.tracks.has("lead")).toBe(true);
		});

		it("bass stem has note events", () => {
			const parsed = parseMidi(stemResult.tracks.get("bass")!);
			const noteOns = parsed.tracks.flatMap(t => t.filter(e => e.type === "noteOn"));
			expect(noteOns.length).toBe(4);
		});

		it("lead stem has note events", () => {
			const parsed = parseMidi(stemResult.tracks.get("lead")!);
			const noteOns = parsed.tracks.flatMap(t => t.filter(e => e.type === "noteOn"));
			expect(noteOns.length).toBe(6);
		});

		it("master combines all tracks", () => {
			expect(masterResult.master).toBeDefined();
			const parsed = parseMidi(masterResult.master!);
			expect(parsed.header.numTracks).toBe(3);
		});
	});

	describe("rich composition → full pipeline", () => {
		const padGain = gain({ level: -9 });
		const pad = oscillator({ type: "sine", id: "pad" });
		pad.to(padGain);
		padGain.to(out());

		const arpFilter = lowpass({ frequency: 3000 });
		const arpGain = gain({ level: -15 });
		const arpSynth = oscillator({ type: "square", id: "arp" });
		arpSynth.to(arpFilter);
		arpFilter.to(arpGain);
		arpGain.to(out());

		const subFilter = lowpass({ frequency: 200 });
		const subGain = gain({ level: -6 });
		const sub = oscillator({ type: "sine", id: "sub" });
		sub.to(subFilter);
		subFilter.to(subGain);
		subGain.to(out());

		const chordA = layer(N.C4(4), N.E4(4), N.G4(4));
		const chordB = layer(N.A3(4), N.C4(4), N.E4(4));
		const chords = sequence(chordA, chordB);

		const arpNotes = sequence(N.C5(0.25), N.E5(0.25), N.G5(0.25), N.C6(0.25));
		const arpRepeated = repeat(arpNotes, 8);

		const bassNote = repeat(N.C2(2), 4);

		const verseChords = transpose(chords, 5);
		const verseArp = transpose(arpRepeated, 5);
		const verseBass = transpose(bassNote, 5);

		const body = timeSignature(
			marker(
				layer(
					chords.route(pad),
					arpRepeated.route(arpSynth),
					bassNote.route(sub),
				),
				"intro",
			),
			[4, 4],
		);

		const verse = layer(
			verseChords.route(pad),
			verseArp.route(arpSynth),
			verseBass.route(sub),
		);

		const pattern = tempo(sequence(body, verse), 128);

		const metadata = collectMetadata(pattern);
		const totalSeconds = beatsToSeconds(pattern.endBeat - pattern.startBeat, metadata.tempoMap);
		const sampleRate = 44100;

		let audioStems: Map<string, AudioBuffer>;
		let audioMaster: AudioBuffer;
		let midiResult: { tracks: Map<string, Uint8Array>; master?: Uint8Array };

		beforeAll(async () => {
			audioStems = new Map();

			for (const trackName of metadata.tracks) {
				const ctx = await getOfflineAudioContext(2, totalSeconds, sampleRate);
				const result = await renderAudio(pattern, ctx, noopFetch, {
					trackFilter: new Set([trackName]),
					metadata,
				});
				audioStems.set(trackName, result.buffer);
				writeWav(trackName, result.buffer, "rich/audio");
			}

			const masterCtx = await getOfflineAudioContext(2, totalSeconds, sampleRate);
			const masterResult = await renderAudio(pattern, masterCtx, noopFetch, { metadata });
			audioMaster = masterResult.buffer;
			writeWav("master", audioMaster, "rich/audio");

			midiResult = renderMidi(pattern, { master: true });

			for (const [name, data] of midiResult.tracks) {
				writeMid(name, data, "rich/midi");
			}

			if (midiResult.master) {
				writeMid("master", midiResult.master, "rich/midi");
			}
		});

		it("discovers three tracks", () => {
			expect(metadata.tracks.size).toBe(3);
			expect(metadata.tracks.has("pad")).toBe(true);
			expect(metadata.tracks.has("arp")).toBe(true);
			expect(metadata.tracks.has("sub")).toBe(true);
		});

		it("collects markers", () => {
			expect(metadata.markers.length).toBeGreaterThanOrEqual(1);
			expect(metadata.markers[0]!.name).toBe("intro");
		});

		it("collects time signatures", () => {
			expect(metadata.timeSignatures.length).toBeGreaterThanOrEqual(1);
			expect(metadata.timeSignatures[0]!.timeSignature[0]).toBe(4);
			expect(metadata.timeSignatures[0]!.timeSignature[1]).toBe(4);
		});

		it("tempo is encoded in MIDI", () => {
			const masterMidi = parseMidi(midiResult.master!);
			const metaTrack = masterMidi.tracks[0]!;
			const tempoEvents = metaTrack.filter(e => e.type === "setTempo");
			expect(tempoEvents.length).toBeGreaterThanOrEqual(1);
		});

		it("all audio stems have audio", () => {
			for (const [name, buffer] of audioStems) {
				expect(hasAudio(buffer), `stem "${name}" should have audio`).toBe(true);
			}
		});

		it("audio master has audio", () => {
			expect(hasAudio(audioMaster)).toBe(true);
		});

		it("all audio stems differ from each other", () => {
			const names = [...audioStems.keys()];
			for (let i = 0; i < names.length; i++) {
				for (let j = i + 1; j < names.length; j++) {
					const a = audioStems.get(names[i]!)!.getChannelData(0);
					const b = audioStems.get(names[j]!)!.getChannelData(0);
					let different = false;
					for (let s = 0; s < a.length; s++) {
						if (a[s] !== b[s]) { different = true; break; }
					}
					expect(different, `"${names[i]}" and "${names[j]}" should differ`).toBe(true);
				}
			}
		});

		it("MIDI has three stem tracks", () => {
			expect(midiResult.tracks.size).toBe(3);
		});

		it("MIDI master combines all tracks", () => {
			expect(midiResult.master).toBeDefined();
			const parsed = parseMidi(midiResult.master!);
			expect(parsed.header.numTracks).toBe(4);
		});

		it("arp track has expected note count", () => {
			const parsed = parseMidi(midiResult.tracks.get("arp")!);
			const noteOns = parsed.tracks.flatMap(t => t.filter(e => e.type === "noteOn"));
			expect(noteOns.length).toBe(64);
		});
	});

	describe("Ode to Joy → recognizable audio + MIDI", () => {
		const melody = oscillator({ type: "triangle", id: "melody" });
		const melodyGain = gain({ level: -6 });
		melody.to(melodyGain);
		melodyGain.to(out());

		// Beethoven — Ode to Joy, first 16 bars
		const phrase1 = sequence(
			N.E4(1), N.E4(1), N.F4(1), N.G4(1),
			N.G4(1), N.F4(1), N.E4(1), N.D4(1),
			N.C4(1), N.C4(1), N.D4(1), N.E4(1),
			N.E4(1.5), N.D4(0.5), N.D4(2),
		);

		const phrase2 = sequence(
			N.E4(1), N.E4(1), N.F4(1), N.G4(1),
			N.G4(1), N.F4(1), N.E4(1), N.D4(1),
			N.C4(1), N.C4(1), N.D4(1), N.E4(1),
			N.D4(1.5), N.C4(0.5), N.C4(2),
		);

		const pattern = tempo(
			sequence(phrase1, phrase2).route(melody),
			120,
		);

		const metadata = collectMetadata(pattern);
		const totalSeconds = beatsToSeconds(pattern.endBeat - pattern.startBeat, metadata.tempoMap);
		const sampleRate = 44100;

		let audioBuffer: AudioBuffer;

		beforeAll(async () => {
			const ctx = await getOfflineAudioContext(2, totalSeconds, sampleRate);
			const result = await renderAudio(pattern, ctx, noopFetch, { metadata });
			audioBuffer = result.buffer;
			writeWav("ode-to-joy", audioBuffer);

			const midi = renderMidi(pattern, { master: true });
			if (midi.master) {
				writeMid("ode-to-joy", midi.master);
			}
		});

		it("has audio", () => {
			expect(hasAudio(audioBuffer)).toBe(true);
		});

		it("has expected duration", () => {
			const expectedBeats = 32;
			const expectedSeconds = beatsToSeconds(expectedBeats, metadata.tempoMap);
			expect(audioBuffer.duration).toBeCloseTo(expectedSeconds, 1);
		});
	});

	describe("Ode to Joy → with effects", () => {
		// Melody: triangle → chorus → reverb → compressor → out
		const melodyOsc = oscillator({ type: "triangle", id: "ode-fx-melody" });
		const melodyChorus = mix(chorus({ rate: 0.8, depth: 0.004 }), 0.3);
		const melodyReverb = mix(reverb({ roomSize: 0.7, damping: 0.4 }), 0.35);
		const melodyGain = gain({ level: -8 });
		const melodyPan = pan({ position: -0.2 });
		melodyOsc.to(melodyChorus);
		melodyChorus.to(melodyReverb);
		melodyReverb.to(melodyGain);
		melodyGain.to(melodyPan);
		melodyPan.to(out());

		// Bass: sine → lowpass → delay → out
		const bassOsc = oscillator({ type: "sine", id: "ode-fx-bass" });
		const bassFilter = lowpass({ frequency: 300 });
		const bassGain = gain({ level: -6 });
		const bassPan = pan({ position: 0.2 });
		bassOsc.to(bassFilter);
		bassFilter.to(bassGain);
		bassGain.to(bassPan);
		bassPan.to(out());

		// Counter-melody: square → lowpass → delay → reverb → out
		const counterOsc = oscillator({ type: "square", id: "ode-fx-counter" });
		const counterFilter = lowpass({ frequency: 2000 });
		const counterDelay = mix(delay({ time: 0.375, feedback: 0.3 }), 0.25);
		const counterReverb = mix(reverb({ roomSize: 0.5, damping: 0.6 }), 0.2);
		const counterGain = gain({ level: -18 });
		counterOsc.to(counterFilter);
		counterFilter.to(counterDelay);
		counterDelay.to(counterReverb);
		counterReverb.to(counterGain);
		counterGain.to(out());

		// Master bus compressor
		const masterComp = compressor({ threshold: -12, ratio: 4, attack: 10, release: 100 });
		const masterGain = gain({ level: -3 });
		masterComp.to(masterGain);
		masterGain.to(out());

		// Beethoven — Ode to Joy melody
		const phrase1 = sequence(
			N.E4(1), N.E4(1), N.F4(1), N.G4(1),
			N.G4(1), N.F4(1), N.E4(1), N.D4(1),
			N.C4(1), N.C4(1), N.D4(1), N.E4(1),
			N.E4(1.5), N.D4(0.5), N.D4(2),
		);
		const phrase2 = sequence(
			N.E4(1), N.E4(1), N.F4(1), N.G4(1),
			N.G4(1), N.F4(1), N.E4(1), N.D4(1),
			N.C4(1), N.C4(1), N.D4(1), N.E4(1),
			N.D4(1.5), N.C4(0.5), N.C4(2),
		);

		// Simple bass: root notes following the harmony
		const bassPhrase1 = sequence(
			N.C3(2), N.C3(2),
			N.G2(2), N.C3(2),
			N.A2(2), N.A2(2),
			N.G2(2), N.G2(2),
		);
		const bassPhrase2 = sequence(
			N.C3(2), N.C3(2),
			N.G2(2), N.C3(2),
			N.F2(2), N.G2(2),
			N.C3(2), N.C3(2),
		);

		// Counter-melody: simple harmonisation a third below, half notes
		const counterPhrase1 = sequence(
			N.C4(2), N.D4(2),
			N.E4(2), N.B3(2),
			N.A3(2), N.B3(2),
			N.C4(2), N.B3(2),
		);
		const counterPhrase2 = sequence(
			N.C4(2), N.D4(2),
			N.E4(2), N.B3(2),
			N.A3(2), N.B3(2),
			N.B3(2), N.C4(2),
		);

		const melodyPart = sequence(phrase1, phrase2).route(melodyOsc);
		const bassPart = sequence(bassPhrase1, bassPhrase2).route(bassOsc);
		const counterPart = sequence(counterPhrase1, counterPhrase2).route(counterOsc);

		const pattern = tempo(
			layer(melodyPart, bassPart, counterPart),
			120,
		);

		const metadata = collectMetadata(pattern);
		const totalSeconds = beatsToSeconds(pattern.endBeat - pattern.startBeat, metadata.tempoMap);
		const sampleRate = 44100;

		let audioBuffer: AudioBuffer;

		beforeAll(async () => {
			const ctx = await getOfflineAudioContext(2, totalSeconds + 1, sampleRate);
			const result = await renderAudio(pattern, ctx, noopFetch, { metadata });
			audioBuffer = result.buffer;
			writeWav("ode-to-joy-fx", audioBuffer);
		});

		it("has audio", () => {
			expect(hasAudio(audioBuffer)).toBe(true);
		});

		it("has expected duration", () => {
			const expectedBeats = 32;
			const expectedSeconds = beatsToSeconds(expectedBeats, metadata.tempoMap);
			expect(audioBuffer.duration).toBeCloseTo(expectedSeconds + 1, 0);
		});
	});
});
