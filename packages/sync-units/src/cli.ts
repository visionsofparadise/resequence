import { Command } from "commander";
import nodeWebAudio from "node-web-audio-api";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createUnitContext } from "./context";
import { MidiUnit } from "./midi-unit";
import { parseMidiFile } from "./midi/parse-midi";
import type { WavBitDepth } from "./rendering/encode-wav";
import { encodeWav } from "./rendering/encode-wav";
import { Unit } from "./unit";
import { computeMaxDuration, computeMaxLatency } from "./utils/graph";

const { OfflineAudioContext: NodeOfflineAudioContext } = nodeWebAudio;

function createSampleLoader(projectDir: string): (path: string) => Promise<AudioBuffer> {
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

program.name("resequence-sync-units").description("Render MIDI or process audio through unit graphs");

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

		if (!existsSync(chainPath)) {
			process.stderr.write(`Error: chain file not found: ${chainPath}\n`);
			process.exit(1);
		}
		if (!existsSync(inputPath)) {
			process.stderr.write(`Error: MIDI file not found: ${inputPath}\n`);
			process.exit(1);
		}

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

			const sampleRate = Number(options.sampleRate);

			const midiData = await readFile(inputPath);
			const midiBytes = new Uint8Array(midiData.buffer, midiData.byteOffset, midiData.byteLength);
			const notes = parseMidiFile(midiBytes);

			const maxCleanupMs = notes.length > 0 ? Math.max(...notes.map((note) => note.cleanupMs)) : 0;
			const durationSeconds = maxCleanupMs / 1000 + 0.5;
			const offlineContext = new NodeOfflineAudioContext(2, Math.ceil(durationSeconds * sampleRate), sampleRate) as unknown as OfflineAudioContext;

			process.stdout.write(`Rendering MIDI: ${inputPath}\n`);

			const latencyBudget = computeMaxLatency(unit);
			const context = createUnitContext(offlineContext as unknown as BaseAudioContext, createSampleLoader(dirname(chainPath)), createModuleLoader(), latencyBudget, dirname(chainPath));

			await unit.setup(context);

			try {
				for (const note of notes) {
					unit.schedule(note, context);
				}

				const audioBuffer = await offlineContext.startRendering();

				const wav = encodeWav(audioBuffer as unknown as AudioBuffer, options.bitDepth as WavBitDepth);
				writeFileSync(outputPath, Buffer.from(wav));

				process.stdout.write(`Output: ${outputPath}\nDone.\n`);
			} finally {
				unit.teardown(context);
			}
		} finally {
			await unregister();
		}
	});

program
	.command("process")
	.description("Process audio file through a self-contained unit graph (read → effects → write)")
	.requiredOption("--chain <entry>", "TypeScript file with default Unit export containing read() and write() units")
	.option("--sample-rate <hz>", "Audio sample rate", "44100")
	.action(async (options: { chain: string; sampleRate: string }) => {
		const chainPath = resolve(options.chain);

		if (!existsSync(chainPath)) {
			process.stderr.write(`Error: chain file not found: ${chainPath}\n`);
			process.exit(1);
		}

		const { register } = await import("tsx/esm/api");
		const unregister = register();

		try {
			const mod = (await import(chainPath)) as Record<string, unknown>;
			const unit = mod.default;

			if (!(unit instanceof Unit)) {
				process.stderr.write("Error: default export must be a Unit\n");
				process.exit(1);
			}

			const sampleRate = Number(options.sampleRate);
			const basePath = dirname(chainPath);
			const getSample = createSampleLoader(basePath);
			const loadModule = createModuleLoader();

			// Probe setup to determine duration from the graph
			const probeContext = createUnitContext(new NodeOfflineAudioContext(2, 1, sampleRate) as unknown as BaseAudioContext, getSample, loadModule, 0, basePath);
			await unit.setup(probeContext);

			const duration = computeMaxDuration(unit);

			if (duration <= 0) {
				process.stderr.write("Error: could not determine audio duration from graph\n");
				process.exit(1);
			}

			unit.teardown(probeContext);

			// Run with correctly-sized offline context
			const totalSamples = Math.ceil(duration * sampleRate);
			const offlineContext = new NodeOfflineAudioContext(2, totalSamples, sampleRate) as unknown as OfflineAudioContext;
			const latencyBudget = computeMaxLatency(unit);
			const context = createUnitContext(offlineContext as unknown as BaseAudioContext, getSample, loadModule, latencyBudget, basePath);

			await unit.setup(context);
			await unit.play(context);

			process.stdout.write("Done.\n");
		} finally {
			await unregister();
		}
	});

program.parse();
