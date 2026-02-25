import type { Pattern } from "../patterns/pattern";
import { collectSampleKeys } from "./collect-sample-keys";
import { loadSample } from "./load-sample";
import { buildTempoMap } from "./tempo-map";
import type { ScheduleContext } from "./schedule-context";

interface AudioRendererOptions {
	readonly trackFilter?: ReadonlySet<string>;
}

export class AudioRenderer {
	private context: ScheduleContext | undefined;
	private readonly audioContext: BaseAudioContext;
	private readonly pattern: Pattern;
	private readonly options: AudioRendererOptions;

	constructor(pattern: Pattern, audioContext: BaseAudioContext, options: AudioRendererOptions = {}) {
		this.pattern = pattern;
		this.audioContext = audioContext;
		this.options = options;
	}

	async setup(fetchBuffer: (path: string) => Promise<ArrayBuffer>): Promise<void> {
		const sampleKeys = collectSampleKeys(this.pattern);
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
		const nodeMap = new Map<string, AudioNode>();

		const baseContext: ScheduleContext = {
			audioContext: this.audioContext,
			sampleMap,
			nodeMap,
			driverMap,
			tempoMap,
			fromTicks: 0,
			toTicks: Infinity,
			trackFilter: this.options.trackFilter,
		};

		this.pattern.setup(baseContext);
		this.context = baseContext;
	}

	prepare(fromTicks: number, toTicks: number): void {
		if (!this.context) throw new Error("AudioRenderer: setup() must be called before prepare()");

		this.pattern.prepare(0, { ...this.context, fromTicks, toTicks });
	}

	schedule(fromTicks: number, toTicks: number): void {
		if (!this.context) throw new Error("AudioRenderer: setup() must be called before schedule()");

		this.pattern.schedule(0, { ...this.context, fromTicks, toTicks });
	}

	render(fromTicks: number, toTicks: number): void {
		if (!this.context) throw new Error("AudioRenderer: setup() must be called before render()");

		const context = { ...this.context, fromTicks, toTicks };
		this.pattern.prepare(0, context);
		this.pattern.schedule(0, context);
	}

	teardown(): void {
		if (!this.context) return;

		this.pattern.teardown(this.context);
		this.context = undefined;
	}
}

function buildProcessorUrl(relativePath: string): string {
	return new URL(relativePath, import.meta.url).href;
}
