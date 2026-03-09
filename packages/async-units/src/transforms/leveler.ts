import type { ChunkBuffer } from "../chunk-buffer";
import { TransformAsyncUnit, type TransformAsyncUnitProperties } from "../transform";
import type { AsyncUnitInput, AudioChunk, StreamContext } from "../unit";

export interface LevelerProperties extends TransformAsyncUnitProperties {
	readonly target: number;
	readonly window: number;
	readonly speed: number;
	readonly maxGain: number;
	readonly maxCut: number;
}

export class LevelerTransformUnit extends TransformAsyncUnit {
	readonly type = ["async-unit", "transform", "leveler"] as const;

	declare readonly properties: LevelerProperties;

	readonly latency = 0;

	private windowSamples = 22050;
	private currentGainDb = 0;

	constructor(properties: AsyncUnitInput<LevelerProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [] };
	}

	get bufferSize(): number {
		return this.windowSamples;
	}

	protected override _setup(context: StreamContext): void {
		super._setup(context);
		this.windowSamples = Math.round(this.properties.window * context.sampleRate);
	}

	override _process(_buffer: ChunkBuffer): void {
		// Processing happens in _unbuffer
	}

	override _unbuffer(chunk: AudioChunk): AudioChunk {
		const { target, speed, maxGain, maxCut } = this.properties;

		let rms = 0;
		let sampleCount = 0;

		for (const channel of chunk.samples) {
			for (const sample of channel) {
				rms += sample * sample;
				sampleCount++;
			}
		}

		rms = sampleCount > 0 ? Math.sqrt(rms / sampleCount) : 0;

		const rmsDb = 20 * Math.log10(Math.max(rms, 1e-10));
		let targetGainDb = target - rmsDb;

		targetGainDb = Math.max(-maxCut, Math.min(maxGain, targetGainDb));

		const alpha = 1 - Math.exp(-1 / (speed * (this.windowSamples / this.properties.window)));
		this.currentGainDb += alpha * (targetGainDb - this.currentGainDb);

		const gainLinear = Math.pow(10, this.currentGainDb / 20);

		const samples = chunk.samples.map((channel) => {
			const output = new Float32Array(channel.length);

			for (let index = 0; index < channel.length; index++) {
				output[index] = (channel[index] ?? 0) * gainLinear;
			}

			return output;
		});

		return { samples, offset: chunk.offset, duration: chunk.duration };
	}

	clone(overrides?: Partial<LevelerProperties>): LevelerTransformUnit {
		return new LevelerTransformUnit({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function leveler(options?: {
	target?: number;
	window?: number;
	speed?: number;
	maxGain?: number;
	maxCut?: number;
	id?: string;
}): LevelerTransformUnit {
	return new LevelerTransformUnit({
		target: options?.target ?? -20,
		window: options?.window ?? 0.5,
		speed: options?.speed ?? 0.1,
		maxGain: options?.maxGain ?? 12,
		maxCut: options?.maxCut ?? 12,
		id: options?.id,
	});
}
