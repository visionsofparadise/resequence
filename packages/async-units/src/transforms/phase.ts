import { TransformAsyncUnit, type TransformAsyncUnitProperties } from "../transform";
import type { AsyncUnitInput, AudioChunk } from "../unit";

export interface PhaseProperties extends TransformAsyncUnitProperties {
	readonly invert: boolean;
	readonly angle?: number;
}

export class PhaseTransformUnit extends TransformAsyncUnit {
	readonly type = ["async-unit", "transform", "phase"] as const;

	declare readonly properties: PhaseProperties;

	readonly bufferSize = 0;
	readonly latency = 0;

	private allpassState: Array<number> = [];

	constructor(properties: AsyncUnitInput<PhaseProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [] };
	}

	override _unbuffer(chunk: AudioChunk): AudioChunk {
		const { invert, angle } = this.properties;

		if (angle !== undefined) {
			return this.applyPhaseRotation(chunk, angle);
		}

		if (invert) {
			return this.applyInvert(chunk);
		}

		return chunk;
	}

	private applyInvert(chunk: AudioChunk): AudioChunk {
		const samples = chunk.samples.map((channel) => {
			const output = new Float32Array(channel.length);

			for (let index = 0; index < channel.length; index++) {
				output[index] = -(channel[index] ?? 0);
			}

			return output;
		});

		return { samples, offset: chunk.offset, duration: chunk.duration };
	}

	private applyPhaseRotation(chunk: AudioChunk, angle: number): AudioChunk {
		const radians = (angle * Math.PI) / 180;
		const coefficient = Math.tan((radians - Math.PI) / 4);

		while (this.allpassState.length < chunk.samples.length) {
			this.allpassState.push(0);
		}

		const samples = chunk.samples.map((channel, ch) => {
			const output = new Float32Array(channel.length);
			let state = this.allpassState[ch] ?? 0;

			for (let index = 0; index < channel.length; index++) {
				const input = channel[index] ?? 0;
				const allpassOut = coefficient * input + state;
				state = input - coefficient * allpassOut;
				output[index] = allpassOut;
			}

			this.allpassState[ch] = state;

			return output;
		});

		return { samples, offset: chunk.offset, duration: chunk.duration };
	}

	clone(overrides?: Partial<PhaseProperties>): PhaseTransformUnit {
		return new PhaseTransformUnit({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function phase(options?: {
	invert?: boolean;
	angle?: number;
	id?: string;
}): PhaseTransformUnit {
	return new PhaseTransformUnit({
		invert: options?.invert ?? true,
		angle: options?.angle,
		id: options?.id,
	});
}

export function invert(options?: { id?: string }): PhaseTransformUnit {
	return phase({ invert: true, id: options?.id });
}
