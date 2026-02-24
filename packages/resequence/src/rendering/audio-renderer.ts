import { buildEffectsMap } from "../instrument/build-effects-map";
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

		const baseContext: ScheduleContext = {
			audioContext: this.audioContext,
			sampleMap,
			effectsMap: {},
			driverMap,
			tempo,
			fromTicks: 0,
			toTicks: Infinity,
			trackFilter: this.options.trackFilter,
		};

		this.pattern.setup(baseContext);

		const { effectsMap } = buildEffectsMap(routing, this.audioContext, sampleMap, driverMap);

		this.context = { ...baseContext, effectsMap };
	}

	schedule(fromTicks: number, toTicks: number): void {
		if (!this.context) throw new Error("AudioRenderer: setup() must be called before schedule()");

		this.pattern.schedule(0, { ...this.context, fromTicks, toTicks });
	}

	teardown(): void {
		if (!this.context) return;

		this.pattern.teardown(this.context);
		this.context = undefined;
	}
}

function buildEnvelopeProcessorBlobUrl(): string {
	const processorPath = new URL("../instrument/envelope-processor.js", import.meta.url);
	return processorPath.href;
}
