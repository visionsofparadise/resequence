import { AutomationScheduler } from "../automation/scheduler";
import type { Pattern } from "../patterns/pattern";
import { loadSample } from "./load-sample";
import type { ScheduleContext } from "./schedule-context";
import { buildTempoMap } from "./tempo-map";

interface AudioRendererOptions {
	readonly trackFilter?: ReadonlySet<string>;
}

export class AudioRenderer {
	private context: ScheduleContext | undefined;
	private readonly audioContext: BaseAudioContext;
	private readonly pattern: Pattern;
	private readonly options: AudioRendererOptions;
	private readonly automationScheduler = new AutomationScheduler();

	constructor(pattern: Pattern, audioContext: BaseAudioContext, options: AudioRendererOptions = {}) {
		this.pattern = pattern;
		this.audioContext = audioContext;
		this.options = options;
	}

	async setup(fetchBuffer: (path: string) => Promise<ArrayBuffer>): Promise<void> {
		const sampleKeys = this.pattern.sampleKeys;
		const tempoMap = buildTempoMap(this.pattern);

		const sampleMap = new Map<string, AudioBuffer>();

		for (const key of sampleKeys) {
			try {
				const audioBuffer = await loadSample(key, this.audioContext, fetchBuffer);

				sampleMap.set(key, audioBuffer);
			} catch {
				// sample not loadable — skip
			}
		}

		await this.audioContext.audioWorklet.addModule(buildProcessorUrl("../nodes/envelope-processor.js"));
		await this.audioContext.audioWorklet.addModule(buildProcessorUrl("../nodes/generators/noise-processor.js"));
		await this.audioContext.audioWorklet.addModule(buildProcessorUrl("../nodes/effects/bitcrush-processor.js"));
		await this.audioContext.audioWorklet.addModule(buildProcessorUrl("../nodes/effects/downsample-processor.js"));

		const driverMap = new Map<string, ConstantSourceNode>();

		const baseContext: ScheduleContext = {
			audioContext: this.audioContext,
			sampleMap,
			driverMap,
			tempoMap,
			fromBeats: 0,
			toBeats: Infinity,
			trackFilter: this.options.trackFilter,
		};

		this.pattern.setup(baseContext);
		this.automationScheduler.setup(this.pattern.automations);
		this.context = baseContext;
	}

	schedule(fromBeats: number, toBeats: number): void {
		if (!this.context) throw new Error("AudioRenderer: setup() must be called before schedule()");

		const context = { ...this.context, fromBeats, toBeats };
		this.automationScheduler.scheduleWindow(fromBeats, toBeats, context);
		this.pattern.schedule(0, context);
	}

	render(fromBeats: number, toBeats: number): void {
		if (!this.context) throw new Error("AudioRenderer: setup() must be called before render()");

		const context = { ...this.context, fromBeats, toBeats };
		this.automationScheduler.scheduleWindow(fromBeats, toBeats, context);
		this.pattern.schedule(0, context);
	}

	teardown(): void {
		if (!this.context) return;

		this.pattern.teardown(this.context);
		this.automationScheduler.reset();
		this.context = undefined;
	}
}

function buildProcessorUrl(relativePath: string): string {
	return new URL(relativePath, import.meta.url).href;
}
