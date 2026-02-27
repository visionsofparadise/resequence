import { AutomationScheduler } from "../automation/scheduler";
import type { Pattern } from "../patterns/pattern";
import { loadSample } from "./load-sample";
import type { ScheduleContext } from "./schedule-context";
import { buildTempoMap } from "./tempo-map";

export interface RenderAudioOptions {
	readonly trackFilter?: ReadonlySet<string>;
}

export async function renderAudio(pattern: Pattern, audioContext: OfflineAudioContext, fetchBuffer: (path: string) => Promise<ArrayBuffer>, options: RenderAudioOptions = {}): Promise<AudioBuffer> {
	const tempoMap = buildTempoMap(pattern);

	const sampleMap = new Map<string, AudioBuffer>();
	for (const key of pattern.sampleKeys) {
		try {
			const audioBuffer = await loadSample(key, audioContext, fetchBuffer);
			sampleMap.set(key, audioBuffer);
		} catch {
			// sample not loadable — skip
		}
	}

	for (const url of pattern.moduleUrls) {
		await audioContext.audioWorklet.addModule(url);
	}

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
