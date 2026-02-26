import type { Pattern } from "../patterns/pattern";
import { AutomationScheduler } from "./automation-scheduler";
import { loadSample } from "./load-sample";
import type { ScheduleContext } from "./schedule-context";
import { buildTempoLog } from "./tempo-log";
import { buildProcessorUrl } from "./utils";

export interface RenderAudioOptions {
	readonly trackFilter?: ReadonlySet<string>;
}

export async function renderAudio(
	pattern: Pattern,
	audioContext: OfflineAudioContext,
	fetchBuffer: (path: string) => Promise<ArrayBuffer>,
	options: RenderAudioOptions = {},
): Promise<AudioBuffer> {
	const tempoMap = buildTempoLog(pattern.metadatas, pattern.automations);

	const sampleMap = new Map<string, AudioBuffer>();
	for (const key of pattern.sampleKeys) {
		try {
			const audioBuffer = await loadSample(key, audioContext, fetchBuffer);
			sampleMap.set(key, audioBuffer);
		} catch {
			// sample not loadable — skip
		}
	}

	await audioContext.audioWorklet.addModule(buildProcessorUrl("../nodes/envelope-processor.js"));
	await audioContext.audioWorklet.addModule(buildProcessorUrl("../nodes/generators/noise-processor.js"));
	await audioContext.audioWorklet.addModule(buildProcessorUrl("../nodes/effects/bitcrush-processor.js"));
	await audioContext.audioWorklet.addModule(buildProcessorUrl("../nodes/effects/downsample-processor.js"));

	const driverMap = new Map<string, ConstantSourceNode>();

	const context: ScheduleContext = {
		audioContext,
		sampleMap,
		driverMap,
		tempoMap,
		fromBeats: 0,
		toBeats: pattern.durationBeats,
		trackFilter: options.trackFilter,
	};

	pattern.setup(context);

	const automationScheduler = new AutomationScheduler();
	automationScheduler.setup(pattern.automations);
	automationScheduler.scheduleWindow(0, pattern.durationBeats, context);

	pattern.schedule(0, context);

	const buffer = await audioContext.startRendering();

	pattern.teardown(context);
	automationScheduler.reset();

	return buffer;
}
