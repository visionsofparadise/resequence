import type { Pattern } from "../patterns/pattern";
import { collectRouting } from "./collect-routing";
import { extractMetadata } from "./extract-metadata";
import type { ScheduleContext } from "./schedule-context";

interface AudioRendererOptions {
	readonly tempo?: number;
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

	async setup(loadSample: (path: string) => Promise<ArrayBuffer>): Promise<void> {
		const routing = collectRouting(this.pattern);
		const meta = extractMetadata(this.pattern);
		const tempo = this.options.tempo ?? meta.tempo;

		const samplePaths = new Set<string>();

		for (const entry of routing.values()) {
			samplePaths.add(entry.path);
		}

		const sampleMap = new Map<string, AudioBuffer>();

		for (const samplePath of samplePaths) {
			try {
				const buffer = await loadSample(samplePath);
				const audioBuffer = await this.audioContext.decodeAudioData(buffer);
				sampleMap.set(samplePath, audioBuffer);
			} catch {
				// sample not loadable — skip
			}
		}

		await this.audioContext.audioWorklet.addModule(buildEnvelopeProcessorBlobUrl());

		const driverMap = new Map<string, ConstantSourceNode>();
		const nodeMap = new Map<string, AudioNode>();

		const baseContext: ScheduleContext = {
			audioContext: this.audioContext,
			sampleMap,
			nodeMap,
			driverMap,
			activeNodes: [],
			tempo,
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

function buildEnvelopeProcessorBlobUrl(): string {
	const processorPath = new URL("../nodes/envelope-processor.js", import.meta.url);

	return processorPath.href;
}
