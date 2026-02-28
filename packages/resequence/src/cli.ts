import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { Pattern } from "./patterns/pattern";
import { collectMarkers } from "./rendering/collect-markers";
import { collectRouting } from "./rendering/collect-routing";
import { encodeWav } from "./rendering/encode-wav";
import { renderAudio } from "./rendering/render-audio";
import { renderMidi } from "./rendering/render-midi";
import { buildTempoMap, beatsToSeconds } from "./rendering/tempo-map";

interface CliOptions {
	readonly entrypoint: string;
	readonly out: string;
	readonly include?: ReadonlyArray<string>;
	readonly exclude?: ReadonlyArray<string>;
	readonly master: boolean;
	readonly midiOnly: boolean;
	readonly audioOnly: boolean;
}

const HELP = `Usage: resequence [entrypoint] [options]

Arguments:
  entrypoint          Path to ts/js file (default: ./index.ts)

Options:
  --out <dir>         Output directory (default: .)
  --include <names>   Comma-separated track names to include
  --exclude <names>   Comma-separated track names to exclude
  --master            Include master MIDI + master WAV
  --midi-only         Only export MIDI
  --audio-only        Only export audio
  --help              Show this help message
`;

export function parseCliArgs(argv: ReadonlyArray<string>): CliOptions | "help" {
	const { values, positionals } = parseArgs({
		args: [...argv],
		options: {
			out: { type: "string", default: "." },
			include: { type: "string" },
			exclude: { type: "string" },
			master: { type: "boolean", default: false },
			"midi-only": { type: "boolean", default: false },
			"audio-only": { type: "boolean", default: false },
			help: { type: "boolean", default: false },
		},
		allowPositionals: true,
		strict: true,
	});

	if (values.help) return "help";

	return {
		entrypoint: positionals[0] ?? "./index.ts",
		out: values.out,
		include: values.include?.split(",").map((name) => name.trim()),
		exclude: values.exclude?.split(",").map((name) => name.trim()),
		master: values.master,
		midiOnly: values["midi-only"],
		audioOnly: values["audio-only"],
	};
}

export function printHelp(): void {
	process.stdout.write(HELP);
}

async function main(): Promise<void> {
	const args = parseCliArgs(process.argv.slice(2));

	if (args === "help") {
		printHelp();
		return;
	}

	await runCli(args);
}

async function runCli(args: CliOptions): Promise<void> {
	const entrypoint = resolve(args.entrypoint);

	if (!existsSync(entrypoint)) {
		process.stderr.write(`Error: entrypoint not found: ${entrypoint}\n`);
		process.exit(1);
	}

	const projectDir = dirname(entrypoint);
	const outDir = resolve(args.out);

	mkdirSync(outDir, { recursive: true });

	process.stdout.write(`Evaluating ${entrypoint}...\n`);

	const { register } = await import("tsx/esm/api");
	const unregister = register();

	try {
		const mod = (await import(entrypoint)) as Record<string, unknown>;
		const pattern = mod.default;

		if (!(pattern instanceof Pattern)) {
			process.stderr.write("Error: default export must be a Pattern\n");
			process.exit(1);
		}

		process.stdout.write(`Pattern: duration=${pattern.endBeat - pattern.startBeat} beats\n`);

		const tempoMap = buildTempoMap(pattern);
		const markers = collectMarkers(pattern);
		const routing = collectRouting(pattern);

		const trackNames = [...routing.keys()];
		const filteredNames = filterNames(trackNames, args.include, args.exclude);

		process.stdout.write(`Tracks: ${filteredNames.join(", ")}\n`);

		if (!args.audioOnly) {
			const midiResult = renderMidi(pattern, {
				include: args.include ? [...args.include] : undefined,
				exclude: args.exclude ? [...args.exclude] : undefined,
				master: args.master,
			});

			for (const [name, data] of midiResult.tracks) {
				const filePath = resolve(outDir, `${name}.mid`);

				writeFileSync(filePath, data);

				process.stdout.write(`  MIDI: ${name}.mid\n`);
			}

			if (midiResult.master) {
				const filePath = resolve(outDir, "master.mid");

				writeFileSync(filePath, midiResult.master);

				process.stdout.write(`  MIDI: master.mid\n`);
			}
		}

		if (!args.midiOnly) {
			const { default: nodeWebAudio } = (await import("node-web-audio-api")) as { default: { OfflineAudioContext: typeof OfflineAudioContext } };
			const { OfflineAudioContext: NodeOfflineAudioContext } = nodeWebAudio;

			const totalSeconds = beatsToSeconds(pattern.endBeat - pattern.startBeat, tempoMap);
			const sampleRate = 44100;

			const fetchProjectBuffer = (path: string) =>
				readFile(resolve(projectDir, path)).then((data) => {
					const copy = new ArrayBuffer(data.byteLength);
					new Uint8Array(copy).set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
					return copy;
				});

			for (const trackName of filteredNames) {
				const offlineCtx = new NodeOfflineAudioContext(2, Math.ceil(totalSeconds * sampleRate), sampleRate);

				const rendered = await renderAudio(pattern, offlineCtx as unknown as OfflineAudioContext, fetchProjectBuffer, {
					trackFilter: new Set([trackName]),
				});

				const wav = encodeWav(rendered as unknown as AudioBuffer, markers, tempoMap);
				const filePath = resolve(outDir, `${trackName}.wav`);

				writeFileSync(filePath, Buffer.from(wav));

				process.stdout.write(`  Audio: ${trackName}.wav\n`);
			}

			if (args.master) {
				const offlineCtx = new NodeOfflineAudioContext(2, Math.ceil(totalSeconds * sampleRate), sampleRate);

				const rendered = await renderAudio(pattern, offlineCtx as unknown as OfflineAudioContext, fetchProjectBuffer);

				const wav = encodeWav(rendered as unknown as AudioBuffer, markers, tempoMap);
				const filePath = resolve(outDir, "master.wav");

				writeFileSync(filePath, Buffer.from(wav));

				process.stdout.write(`  Audio: master.wav\n`);
			}
		}

		process.stdout.write("Done.\n");
	} finally {
		await unregister();
	}
}

function filterNames(names: ReadonlyArray<string>, include?: ReadonlyArray<string>, exclude?: ReadonlyArray<string>): ReadonlyArray<string> {
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

main().catch((error: unknown) => {
	process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);

	process.exit(1);
});
