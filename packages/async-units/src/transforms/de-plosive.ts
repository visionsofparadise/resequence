import { TransformAsyncUnit, type TransformAsyncUnitProperties } from "../transform";
import type { AsyncUnitInput, AudioChunk, StreamContext } from "../unit";

export interface DePlosiveProperties extends TransformAsyncUnitProperties {
	readonly sensitivity: number;
	readonly frequency: number;
}

export class DePlosiveTransformUnit extends TransformAsyncUnit {
	readonly type = ["async-unit", "transform", "de-plosive"] as const;

	declare readonly properties: DePlosiveProperties;

	readonly latency = 0;

	private sampleRate = 44100;
	private lpState: Array<number> = [];

	constructor(properties: AsyncUnitInput<DePlosiveProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [] };
	}

	get bufferSize(): number {
		return Math.round(this.sampleRate * 0.02);
	}

	protected override _setup(context: StreamContext): void {
		super._setup(context);
		this.sampleRate = context.sampleRate;
	}

	override _unbuffer(chunk: AudioChunk): AudioChunk {
		const { sensitivity, frequency } = this.properties;
		const cutoffCoeff = Math.exp((-2 * Math.PI * frequency) / this.sampleRate);
		const threshold = 0.1 * (1 - sensitivity);

		while (this.lpState.length < chunk.samples.length) {
			this.lpState.push(0);
		}

		const samples = chunk.samples.map((channel, ch) => {
			const output = new Float32Array(channel.length);
			let lpVal = this.lpState[ch] ?? 0;

			let lowEnergy = 0;
			let totalEnergy = 0;

			for (const sample of channel) {
				lpVal = lpVal * cutoffCoeff + sample * (1 - cutoffCoeff);
				lowEnergy += lpVal * lpVal;
				totalEnergy += sample * sample;
			}

			this.lpState[ch] = lpVal;

			const lowRatio = totalEnergy > 0 ? lowEnergy / totalEnergy : 0;
			const isPlosive = lowRatio > 0.5 && Math.sqrt(lowEnergy / channel.length) > threshold;

			if (isPlosive) {
				const fadeLength = Math.min(channel.length, Math.round(this.sampleRate * 0.005));

				for (let index = 0; index < channel.length; index++) {
					const sample = channel[index] ?? 0;
					const filtered = sample - (lpVal * cutoffCoeff + sample * (1 - cutoffCoeff)) * 0.8;

					let fade = 1;

					if (index < fadeLength) {
						fade = index / fadeLength;
					} else if (index > channel.length - fadeLength) {
						fade = (channel.length - index) / fadeLength;
					}

					output[index] = sample * (1 - fade) + filtered * fade;
				}
			} else {
				output.set(channel);
			}

			return output;
		});

		return { samples, offset: chunk.offset, duration: chunk.duration };
	}

	clone(overrides?: Partial<DePlosiveProperties>): DePlosiveTransformUnit {
		return new DePlosiveTransformUnit({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function dePlosive(options?: {
	sensitivity?: number;
	frequency?: number;
	id?: string;
}): DePlosiveTransformUnit {
	return new DePlosiveTransformUnit({
		sensitivity: options?.sensitivity ?? 0.5,
		frequency: options?.frequency ?? 200,
		id: options?.id,
	});
}
