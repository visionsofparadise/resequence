import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { Command } from "commander";
import { Router } from "./router";
import type { WavBitDepth } from "@resequence/web-au-utils";

async function loadRouter(entrypoint: string): Promise<Router> {
	const fullPath = resolve(entrypoint);

	if (!existsSync(fullPath)) {
		throw new Error(`Entrypoint not found: ${fullPath}`);
	}

	const { register } = await import("tsx/esm/api");
	const unregister = register();

	try {
		const mod = (await import(fullPath)) as Record<string, unknown>;
		const defaultExport = mod.default;

		if (Router.is(defaultExport)) {
			return defaultExport;
		}

		throw new Error("default export is not a Router");
	} finally {
		await unregister();
	}
}

function makeFetchBuffer(entrypoint: string): (path: string) => Promise<ArrayBuffer> {
	const projectDir = dirname(resolve(entrypoint));

	return (path: string) =>
		readFile(resolve(projectDir, path)).then((data) => {
			const copy = new ArrayBuffer(data.byteLength);

			new Uint8Array(copy).set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));

			return copy;
		});
}

const program = new Command();

program.name("resequence").description("Resequence — music composition toolkit").version("0.1.0");

program
	.command("render")
	.description("Render audio stems from a source")
	.argument("[entrypoint]", "Path to ts/js file", "./index.ts")
	.option("--out <dir>", "Output directory", ".")
	.option("--include <names>", "Comma-separated port names to include")
	.option("--exclude <names>", "Comma-separated port names to exclude")
	.option("--master", "Include master mix", false)
	.option("--midi-only", "Only export MIDI", false)
	.option("--audio-only", "Only export audio", false)
	.option("--sample-rate <hz>", "Audio sample rate", "44100")
	.option("--bit-depth <depth>", "WAV bit depth: 16, 24, 32, 32f, 64", "24")
	.action(async (entrypoint: string, options: Record<string, string | boolean | undefined>) => {
		const router = await loadRouter(entrypoint);
		const outDir = resolve(options.out as string);

		mkdirSync(outDir, { recursive: true });

		process.stdout.write(`Rendering ${resolve(entrypoint)}...\n`);

		const include =
			typeof options.include === "string" ? options.include.split(",").map((name) => name.trim()) : undefined;
		const exclude =
			typeof options.exclude === "string" ? options.exclude.split(",").map((name) => name.trim()) : undefined;

		const result = await router.render(makeFetchBuffer(entrypoint), {
			output: outDir,
			sampleRate: Number(options.sampleRate ?? 44100),
			bitDepth: (options.bitDepth ?? "24") as WavBitDepth,
			include,
			exclude,
			master: options.master as boolean,
			midiOnly: options.midiOnly as boolean,
			audioOnly: options.audioOnly as boolean,
		});

		for (const stem of result.stems) {
			const filePath = resolve(outDir, `${stem.portKey}.wav`);

			writeFileSync(filePath, Buffer.from(stem.wav));
			process.stdout.write(`  Audio: ${stem.portKey}.wav\n`);
		}

		if (result.master) {
			const filePath = resolve(outDir, "master.wav");

			writeFileSync(filePath, Buffer.from(result.master.wav));
			process.stdout.write(`  Audio: master.wav\n`);
		}

		process.stdout.write("Done.\n");
	});

program
	.command("play")
	.description("Play audio in real-time")
	.argument("[entrypoint]", "Path to ts/js file", "./index.ts")
	.option("--start-beat <beat>", "Beat to start playback from", "0")
	.action(async (entrypoint: string, options: Record<string, string>) => {
		const router = await loadRouter(entrypoint);

		const { default: nodeWebAudio } = (await import("node-web-audio-api")) as {
			default: { AudioContext: typeof AudioContext };
		};
		const audioContext = new nodeWebAudio.AudioContext();

		const playback = router.play(audioContext);

		await playback.setup(makeFetchBuffer(entrypoint));

		const startBeat = Number(options.startBeat ?? 0);

		process.stdout.write(`Playing from beat ${startBeat}...\n`);

		playback.on("marker", (name, beat) => {
			process.stdout.write(`  [${beat.toFixed(1)}] ${name}\n`);
		});

		playback.on("statechange", (state) => {
			if (state === "stopped") {
				process.stdout.write("Playback finished.\n");
				process.exit(0);
			}
		});

		process.on("SIGINT", () => {
			playback.stop();
			process.exit(0);
		});

		await playback.play(startBeat);
	});

program
	.command("export-midi")
	.description("Export MIDI files")
	.argument("[entrypoint]", "Path to ts/js file", "./index.ts")
	.option("--out <dir>", "Output directory", ".")
	.option("--ppq <number>", "Pulses per quarter note", "480")
	.action(async (entrypoint: string, options: Record<string, string>) => {
		const router = await loadRouter(entrypoint);
		const outDir = resolve(options.out ?? ".");

		mkdirSync(outDir, { recursive: true });

		process.stdout.write(`Exporting MIDI from ${resolve(entrypoint)}...\n`);

		const pattern = router.pattern;

		const { renderMidi } = await import("@resequence/patterns-utils");

		const midiTracks = renderMidi(pattern, {});

		for (const [name, data] of midiTracks) {
			const filePath = resolve(outDir, `${name}.mid`);

			writeFileSync(filePath, data);
			process.stdout.write(`  MIDI: ${name}.mid\n`);
		}

		process.stdout.write("Done.\n");
	});

program.parse();
