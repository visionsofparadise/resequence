import type { Pattern } from "../patterns/pattern";
import { loadSample } from "./load-sample";
import type { PatternMetadata } from "./pattern-metadata";
import { collectMetadata } from "./pattern-metadata";
import type { ScheduleContext } from "./schedule-context";
import { scheduleNotes } from "./schedule-notes";

export interface RenderAudioOptions {
	readonly trackFilter?: ReadonlySet<string>;
	readonly metadata?: PatternMetadata;
}

export interface RenderAudioResult {
	readonly buffer: AudioBuffer;
	readonly metadata: PatternMetadata;
}

export async function renderAudio(pattern: Pattern, audioContext: OfflineAudioContext, fetchBuffer: (path: string) => Promise<ArrayBuffer>, options: RenderAudioOptions = {}): Promise<RenderAudioResult> {
	const metadata = options.metadata ?? collectMetadata(pattern);
	const tempoMap = metadata.tempoMap;
	const sampleCache = new Map<string, AudioBuffer>();
	const loadedModules = new Set<string>();
	const driverMap: ScheduleContext["driverMap"] = new Map();

	const context: ScheduleContext = {
		audioContext,
		driverMap,
		tempoMap,
		fromBeats: 0,
		toBeats: pattern.endBeat - pattern.startBeat,
		trackFilter: options.trackFilter,
		outputs: [],
		dispatch: (note, offsetBeats, outputs, scheduleContext) => {
			const { trackFilter } = scheduleContext;
			const filtered = trackFilter
				? outputs.filter((output) => output.id !== undefined && trackFilter.has(output.id))
				: outputs;
			if (filtered.length === 0) return;
			scheduleNotes([note], offsetBeats, filtered, scheduleContext);
		},
		getSample: async (path: string) => {
			const cached = sampleCache.get(path);

			if (cached) return cached;

			const buffer = await loadSample(path, audioContext, fetchBuffer);

			sampleCache.set(path, buffer);

			return buffer;
		},
		loadModule: async (url: string) => {
			if (loadedModules.has(url)) return;

			await audioContext.audioWorklet.addModule(url);

			loadedModules.add(url);
		},
	};

	await pattern.setup(context);
	pattern.schedule(0, context);

	const buffer = await audioContext.startRendering();

	pattern.teardown(context);

	return { buffer, metadata };
}
