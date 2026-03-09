import type { StreamContext } from "../unit";
import { FfmpegTransformUnit, type FfmpegTransformProperties } from "./ffmpeg";
import type { AsyncUnitInput } from "../unit";

export interface ResampleProperties extends FfmpegTransformProperties {
	readonly sampleRate: number;
	readonly dither?: "triangular" | "lipshitz" | "none";
}

export class ResampleTransformUnit extends FfmpegTransformUnit {
	readonly type = ["async-unit", "transform", "ffmpeg", "resample"] as const;

	declare readonly properties: ResampleProperties;

	constructor(properties: AsyncUnitInput<ResampleProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [] };
	}

	protected _buildArgs(_context: StreamContext): Array<string> {
		const { sampleRate, dither } = this.properties;
		const ditherMethod = dither ?? "triangular";

		return ["-af", `aresample=${sampleRate}:resampler=soxr:dither_method=${ditherMethod}`];
	}

	clone(overrides?: Partial<ResampleProperties>): ResampleTransformUnit {
		return new ResampleTransformUnit({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function resample(sampleRate: number, options?: {
	dither?: "triangular" | "lipshitz" | "none";
	binaryPath?: string;
	id?: string;
}): ResampleTransformUnit {
	return new ResampleTransformUnit({
		sampleRate,
		dither: options?.dither,
		binaryPath: options?.binaryPath,
		id: options?.id,
	});
}
