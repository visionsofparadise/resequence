import type { ChunkBuffer } from "../chunk-buffer";
import { TransformAsyncUnit, type TransformAsyncUnitProperties } from "../transform";
import type { AsyncUnitInput, StreamContext } from "../unit";
import { createOnnxSession, type OnnxSession } from "../utils/onnx-runtime";

export interface VoiceDenoiseProperties extends TransformAsyncUnitProperties {
	readonly modelPath: string;
}

export class VoiceDenoiseTransformUnit extends TransformAsyncUnit {
	readonly type = ["async-unit", "transform", "voice-denoise"] as const;

	declare readonly properties: VoiceDenoiseProperties;

	readonly bufferSize = Infinity;
	readonly latency = Infinity;

	private session?: OnnxSession;
	private denoiseSampleRate = 48000;

	constructor(properties: AsyncUnitInput<VoiceDenoiseProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [] };
	}

	override async setup(context: StreamContext): Promise<void> {
		await super.setup(context);
		this.denoiseSampleRate = context.sampleRate;
		this.session = await createOnnxSession(this.properties.modelPath);
	}

	override async _process(buffer: ChunkBuffer): Promise<void> {
		if (!this.session) {
			throw new Error("VoiceDenoiseTransformUnit not set up — ONNX session not initialized");
		}

		const frames = buffer.frames;
		const channels = buffer.channels;
		const frameSize = Math.round(this.denoiseSampleRate * 0.01);

		for (let ch = 0; ch < channels; ch++) {
			const chunk = await buffer.read(0, frames);
			const channel = chunk.samples[ch];

			if (!channel) continue;

			const output = new Float32Array(frames);
			let offset = 0;

			while (offset < frames) {
				const end = Math.min(offset + frameSize, frames);
				const frameData = channel.slice(offset, end);

				const padded = new Float32Array(frameSize);
				padded.set(frameData);

				const result = await this.session.run({
					input: { data: padded, dims: [1, 1, frameSize] },
				});

				const outputTensor = result.output ?? result.enhanced ?? Object.values(result)[0];

				if (outputTensor) {
					const outputData = outputTensor.data;

					for (let index = 0; index < end - offset; index++) {
						output[offset + index] = outputData[index] ?? 0;
					}
				}

				offset = end;
			}

			const allChannels: Array<Float32Array> = [];

			for (let writeCh = 0; writeCh < channels; writeCh++) {
				allChannels.push(writeCh === ch ? output : (chunk.samples[writeCh] ?? new Float32Array(frames)));
			}

			await buffer.write(0, allChannels);
		}
	}

	protected override _teardown(): void {
		this.session?.dispose();
		this.session = undefined;
	}

	clone(overrides?: Partial<VoiceDenoiseProperties>): VoiceDenoiseTransformUnit {
		return new VoiceDenoiseTransformUnit({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function voiceDenoise(modelPath: string, options?: {
	id?: string;
}): VoiceDenoiseTransformUnit {
	return new VoiceDenoiseTransformUnit({
		modelPath,
		id: options?.id,
	});
}
