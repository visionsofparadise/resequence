import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Command } from "commander";
import { MidiUnit } from "./midi-unit";
import type { WavBitDepth } from "./rendering/encode-wav";
import { encodeWav } from "./rendering/encode-wav";
import { processAudio } from "./rendering/process-audio";
import { renderAudio } from "./rendering/render-audio";
import { Unit } from "./unit";

async function loadNodeAudio(): Promise<{ OfflineAudioContext: typeof OfflineAudioContext }> {
	const { default: nodeWebAudio } = (await import("node-web-audio-api")) as { default: { OfflineAudioContext: typeof OfflineAudioContext } };
	return { OfflineAudioContext: nodeWebAudio.OfflineAudioContext };
}

function createSampleLoader(projectDir: string, NodeOfflineAudioContext: typeof OfflineAudioContext): (path: string) => Promise<AudioBuffer> {
	return async (path: string): Promise<AudioBuffer> => {
		const data = await readFile(resolve(projectDir, path));
		const copy = new ArrayBuffer(data.byteLength);
		new Uint8Array(copy).set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
		const offlineCtx = new NodeOfflineAudioContext(1, 1, 44100);
		return (offlineCtx as unknown as OfflineAudioContext).decodeAudioData(copy);
	};
}

function createModuleLoader(): (url: string) => Promise<void> {
	const loaded = new Set<string>();
	return (url: string): Promise<void> => {
		if (loaded.has(url)) return Promise.resolve();
		loaded.add(url);
		return Promise.resolve();
	};
}

const program = new Command();

program
	.name("resequence-units")
	.description("Render MIDI or process audio through unit graphs");

program
	.command("render")
	.description("Render MIDI file to audio through a unit graph")
	.requiredOption("--midi <file>", "MIDI input file")
	.requiredOption("--chain <entry>", "TypeScript file with default MidiUnit export")
	.requiredOption("--output <file>", "Output WAV file path")
	.option("--sample-rate <hz>", "Audio sample rate", "44100")
	.option("--bit-depth <depth>", "WAV bit depth: 16, 24, 32, 32f, 64", "24")
	.action(async (options: { midi: string; chain: string; output: string; sampleRate: string; bitDepth: string }) => {
		const chainPath = resolve(options.chain);
		const inputPath = resolve(options.midi);
		const outputPath = resolve(options.output);

		if (!existsSync(chainPath)) { process.stderr.write(`Error: chain file not found: ${chainPath}\n`); process.exit(1); }
		if (!existsSync(inputPath)) { process.stderr.write(`Error: MIDI file not found: ${inputPath}\n`); process.exit(1); }

		mkdirSync(dirname(outputPath), { recursive: true });

		const { register } = await import("tsx/esm/api");
		const unregister = register();

		try {
			const mod = (await import(chainPath)) as Record<string, unknown>;
			const unit = mod.default;

			if (!(unit instanceof MidiUnit)) {
				process.stderr.write("Error: default export must be a MidiUnit\n");
				process.exit(1);
			}

			const { OfflineAudioContext: NodeOfflineAudioContext } = await loadNodeAudio();
			const sampleRate = Number(options.sampleRate);

			const midiData = await readFile(inputPath);
			const midiBytes = new Uint8Array(midiData.buffer, midiData.byteOffset, midiData.byteLength);
			const notes = (await import("./midi/parse-midi")).parseMidiFile(midiBytes);

			const maxCleanupMs = notes.length > 0 ? Math.max(...notes.map((note) => note.cleanupMs)) : 0;
			const durationSeconds = maxCleanupMs / 1000 + 0.5;
			const offlineContext = new NodeOfflineAudioContext(2, Math.ceil(durationSeconds * sampleRate), sampleRate) as unknown as OfflineAudioContext;

			process.stdout.write(`Rendering MIDI: ${inputPath}\n`);

			const audioBuffer = await renderAudio({
				midi: midiBytes,
				unit,
				audioContext: offlineContext,
				getSample: createSampleLoader(dirname(chainPath), NodeOfflineAudioContext),
				loadModule: createModuleLoader(),
			});

			const wav = encodeWav(audioBuffer as unknown as AudioBuffer, options.bitDepth as WavBitDepth);
			writeFileSync(outputPath, Buffer.from(wav));

			process.stdout.write(`Output: ${outputPath}\nDone.\n`);
		} finally {
			await unregister();
		}
	});

program
	.command("process")
	.description("Process audio file through a unit graph")
	.requiredOption("--audio <file>", "Audio input file")
	.requiredOption("--chain <entry>", "TypeScript file with default Unit export")
	.requiredOption("--output <file>", "Output WAV file path")
	.option("--sample-rate <hz>", "Audio sample rate", "44100")
	.option("--bit-depth <depth>", "WAV bit depth: 16, 24, 32, 32f, 64", "24")
	.action(async (options: { audio: string; chain: string; output: string; sampleRate: string; bitDepth: string }) => {
		const chainPath = resolve(options.chain);
		const inputPath = resolve(options.audio);
		const outputPath = resolve(options.output);

		if (!existsSync(chainPath)) { process.stderr.write(`Error: chain file not found: ${chainPath}\n`); process.exit(1); }
		if (!existsSync(inputPath)) { process.stderr.write(`Error: audio file not found: ${inputPath}\n`); process.exit(1); }

		mkdirSync(dirname(outputPath), { recursive: true });

		const { register } = await import("tsx/esm/api");
		const unregister = register();

		try {
			const mod = (await import(chainPath)) as Record<string, unknown>;
			const unit = mod.default;

			if (!(unit instanceof Unit)) {
				process.stderr.write("Error: default export must be a Unit\n");
				process.exit(1);
			}

			const { OfflineAudioContext: NodeOfflineAudioContext } = await loadNodeAudio();
			const sampleRate = Number(options.sampleRate);

			const audioData = await readFile(inputPath);
			const arrayBuffer = new ArrayBuffer(audioData.byteLength);
			new Uint8Array(arrayBuffer).set(new Uint8Array(audioData.buffer, audioData.byteOffset, audioData.byteLength));

			const decodeCtx = new NodeOfflineAudioContext(1, 1, sampleRate) as unknown as OfflineAudioContext;
			const inputBuffer = await decodeCtx.decodeAudioData(arrayBuffer);

			const totalSamples = Math.ceil(inputBuffer.duration * sampleRate);
			const offlineContext = new NodeOfflineAudioContext(inputBuffer.numberOfChannels, totalSamples, sampleRate) as unknown as OfflineAudioContext;

			process.stdout.write(`Processing audio: ${inputPath}\n`);

			const audioBuffer = await processAudio({
				audio: inputBuffer,
				unit,
				audioContext: offlineContext,
				getSample: createSampleLoader(dirname(chainPath), NodeOfflineAudioContext),
				loadModule: createModuleLoader(),
			});

			const wav = encodeWav(audioBuffer as unknown as AudioBuffer, options.bitDepth as WavBitDepth);
			writeFileSync(outputPath, Buffer.from(wav));

			process.stdout.write(`Output: ${outputPath}\nDone.\n`);
		} finally {
			await unregister();
		}
	});

program.parse();
