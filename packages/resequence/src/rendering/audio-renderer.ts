import { seekAutomation } from "../automation/seek";
import type { Pattern } from "../patterns/pattern";
import { loadSample } from "./load-sample";
import type { ScheduleContext } from "./schedule-context";
import { scheduleNotes } from "./schedule-notes";
import { buildTempoMap } from "./tempo-map";

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
		const driverMap = new Map<string, ConstantSourceNode>();
		const loadedModules = new Set<string>();
		const sampleMap = new Map<string, AudioBuffer>();
		const tempoMap = buildTempoMap(this.pattern);

		const baseContext: ScheduleContext = {
			audioContext: this.audioContext,
			sampleMap,
			driverMap,
			tempoMap,
			fromBeats: 0,
			toBeats: Infinity,
			trackFilter: this.options.trackFilter,
			outputs: [],
			dispatch: (note, offsetBeats, outputs, scheduleContext) => {
				scheduleNotes([note], offsetBeats, outputs, scheduleContext);
			},
			getSample: async (path: string) => {
				const cached = sampleMap.get(path);

				if (cached) return cached;

				const buffer = await loadSample(path, this.audioContext, fetchBuffer);

				sampleMap.set(path, buffer);

				return buffer;
			},
			loadModule: async (url: string) => {
				if (loadedModules.has(url)) return;

				await this.audioContext.audioWorklet.addModule(url);

				loadedModules.add(url);
			},
		};

		await this.pattern.setup(baseContext);
		this.context = baseContext;
	}

	schedule(fromBeats: number, toBeats: number): void {
		if (!this.context) throw new Error("AudioRenderer: setup() must be called before schedule()");

		const context = { ...this.context, fromBeats, toBeats };
		seekAutomation(this.pattern, fromBeats, context);
		this.pattern.schedule(0, context);
	}

	render(fromBeats: number, toBeats: number): void {
		if (!this.context) throw new Error("AudioRenderer: setup() must be called before render()");

		const context = { ...this.context, fromBeats, toBeats };
		this.pattern.schedule(0, context);
	}

	teardown(): void {
		if (!this.context) return;

		this.pattern.teardown(this.context);
		this.context = undefined;
	}
}
