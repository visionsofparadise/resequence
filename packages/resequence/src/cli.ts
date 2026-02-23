import { parseArgs } from "node:util";
import type { RoutingEntry } from "./rendering/collect-routing";
import type { Pattern } from "./patterns/pattern";
import type { ScheduleContext } from "./rendering/schedule-context";

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
	const { resolve, dirname } = await import("node:path");
	const { existsSync, mkdirSync, writeFileSync } = await import("node:fs");
	const { readFile } = await import("node:fs/promises");

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
		const mod = await import(entrypoint) as Record<string, unknown>;
		const pattern = mod.default;

		if (!pattern || typeof pattern !== "object" || !("type" in pattern) || !("durationTicks" in pattern)) {
			process.stderr.write("Error: default export must be a Pattern\n");
			process.exit(1);
		}

		const typedPattern = pattern as Pattern;

		process.stdout.write(`Pattern: type=${typedPattern.type}, duration=${typedPattern.durationTicks} ticks\n`);

		const { extractMetadata } = await import("./rendering/extract-metadata");
		const { collectRouting } = await import("./rendering/collect-routing");
		const meta = extractMetadata(typedPattern);
		const routing = collectRouting(typedPattern);

		const trackNames = [...routing.keys()];
		const filteredNames = filterNames(trackNames, args.include, args.exclude);

		process.stdout.write(`Tempo: ${meta.tempo} bpm, Tracks: ${filteredNames.join(", ")}\n`);

		if (!args.audioOnly) {
			const { renderMidi } = await import("./rendering/render-midi");
			const midiResult = renderMidi(typedPattern, {
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
			const { default: nodeWebAudio } = await import("node-web-audio-api") as { default: { OfflineAudioContext: typeof OfflineAudioContext } };
			const { OfflineAudioContext: NodeOfflineAudioContext } = nodeWebAudio;
			const { buildEffectsMap } = await import("./instrument/build-effects-map");
			const { encodeWav } = await import("./rendering/encode-wav");
			const { ticksToSeconds } = await import("./rendering/ticks-to-seconds");

			const totalSeconds = ticksToSeconds(typedPattern.durationTicks, meta.tempo);
			const sampleRate = 44100;

			const sampleBank = await loadSamples(routing, projectDir, NodeOfflineAudioContext, readFile);

			for (const trackName of filteredNames) {
				const offlineCtx = new NodeOfflineAudioContext(2, Math.ceil(totalSeconds * sampleRate), sampleRate);
				const effectsMap = buildEffectsMap(routing, offlineCtx as unknown as BaseAudioContext, sampleBank);
				const scheduleContext: ScheduleContext = {
					audioContext: offlineCtx as unknown as BaseAudioContext,
					sampleBank,
					effectsMap,
					tempo: meta.tempo,
					fromTicks: 0,
					toTicks: Infinity,
					trackFilter: new Set([trackName]),
				};

				typedPattern.schedule(0, scheduleContext);
				const rendered = await offlineCtx.startRendering();
				const wav = encodeWav(rendered as unknown as AudioBuffer);
				const filePath = resolve(outDir, `${trackName}.wav`);
				writeFileSync(filePath, Buffer.from(wav));
				process.stdout.write(`  Audio: ${trackName}.wav\n`);
			}

			if (args.master) {
				const offlineCtx = new NodeOfflineAudioContext(2, Math.ceil(totalSeconds * sampleRate), sampleRate);
				const effectsMap = buildEffectsMap(routing, offlineCtx as unknown as BaseAudioContext, sampleBank);
				const scheduleContext: ScheduleContext = {
					audioContext: offlineCtx as unknown as BaseAudioContext,
					sampleBank,
					effectsMap,
					tempo: meta.tempo,
					fromTicks: 0,
					toTicks: Infinity,
				};

				typedPattern.schedule(0, scheduleContext);
				const rendered = await offlineCtx.startRendering();
				const wav = encodeWav(rendered as unknown as AudioBuffer);
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

function filterNames(
	names: ReadonlyArray<string>,
	include?: ReadonlyArray<string>,
	exclude?: ReadonlyArray<string>,
): ReadonlyArray<string> {
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

async function loadSamples(
	routing: Map<string, RoutingEntry>,
	projectDir: string,
	NodeOfflineAudioContext: typeof OfflineAudioContext,
	readFile: (path: string) => Promise<Buffer>,
): Promise<Map<string, AudioBuffer>> {
	const { resolve } = await import("node:path");
	const samplePaths = new Set<string>();

	for (const entry of routing.values()) {
		if (entry.type === "instrument") {
			for (const zone of entry.instrument.zones) {
				samplePaths.add(zone.sample);
			}
			if (entry.instrument.mapping) {
				for (const value of Object.values(entry.instrument.mapping)) {
					if (typeof value === "string") {
						samplePaths.add(value);
					} else {
						for (const layer of value) {
							samplePaths.add(layer.sample);
						}
					}
				}
			}
		} else {
			samplePaths.add(entry.path);
		}

		if (entry.effects) {
			for (const effect of Object.values(entry.effects)) {
				if (effect.type === "reverb") samplePaths.add(effect.impulse);
			}
		}
	}

	const bank = new Map<string, AudioBuffer>();
	const decoder = new NodeOfflineAudioContext(1, 1, 44100);

	for (const samplePath of samplePaths) {
		const absolutePath = resolve(projectDir, samplePath);
		try {
			const fileData = await readFile(absolutePath);
			const copy = new ArrayBuffer(fileData.byteLength);
			new Uint8Array(copy).set(new Uint8Array(fileData.buffer, fileData.byteOffset, fileData.byteLength));
			const audioBuffer = await (decoder as unknown as BaseAudioContext).decodeAudioData(copy);
			bank.set(samplePath, audioBuffer);
		} catch {
			process.stderr.write(`Warning: could not load sample: ${absolutePath}\n`);
		}
	}

	return bank;
}

main().catch((error: unknown) => {
	process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
	process.exit(1);
});
