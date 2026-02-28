import type { Pattern } from "../patterns/pattern";
import { loadSample } from "./load-sample";
import type { ScheduleContext } from "./schedule-context";
import { scheduleNotes } from "./schedule-notes";
import { buildTempoMap } from "./tempo-map";

export interface RenderAudioOptions {
	readonly trackFilter?: ReadonlySet<string>;
}

export async function renderAudio(pattern: Pattern, audioContext: OfflineAudioContext, fetchBuffer: (path: string) => Promise<ArrayBuffer>, options: RenderAudioOptions = {}): Promise<AudioBuffer> {
	// FIX: Tempo map is never used by anything in the setup phase, we could just collect it while doing our setup walk. This would also apply for metadatas, which we need to gather markers in playback renderer
	const tempoMap = buildTempoMap(pattern);
	const sampleMap = new Map<string, AudioBuffer>();
	const loadedModules = new Set<string>();
	const driverMap = new Map<string, ConstantSourceNode>();

	const context: ScheduleContext = {
		audioContext,
		sampleMap,
		driverMap,
		tempoMap,
		fromBeats: 0,
		toBeats: pattern.endBeat - pattern.startBeat,
		trackFilter: options.trackFilter,
		outputs: [],
		dispatch: (note, offsetBeats, outputs, scheduleContext) => {
			scheduleNotes([note], offsetBeats, outputs, scheduleContext);
		},
		getSample: async (path: string) => {
			const cached = sampleMap.get(path);

			if (cached) return cached;

			const buffer = await loadSample(path, audioContext, fetchBuffer);

			sampleMap.set(path, buffer);

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

	return buffer;
}
