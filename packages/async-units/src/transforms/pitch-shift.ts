import type { StreamContext } from "../unit";
import { FfmpegTransformUnit, type FfmpegTransformProperties } from "./ffmpeg";
import type { AsyncUnitInput } from "../unit";

export interface PitchShiftProperties extends FfmpegTransformProperties {
	readonly semitones: number;
	readonly cents?: number;
}

export class PitchShiftTransformUnit extends FfmpegTransformUnit {
	readonly type = ["async-unit", "transform", "ffmpeg", "pitch-shift"] as const;

	declare readonly properties: PitchShiftProperties;

	constructor(properties: AsyncUnitInput<PitchShiftProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [] };
	}

	protected _buildArgs(_context: StreamContext): Array<string> {
		const { semitones, cents } = this.properties;
		const totalSemitones = semitones + (cents ?? 0) / 100;
		const pitchRatio = Math.pow(2, totalSemitones / 12);

		return ["-af", `rubberband=pitch=${pitchRatio}`];
	}

	clone(overrides?: Partial<PitchShiftProperties>): PitchShiftTransformUnit {
		return new PitchShiftTransformUnit({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function pitchShift(semitones: number, options?: {
	cents?: number;
	binaryPath?: string;
	id?: string;
}): PitchShiftTransformUnit {
	return new PitchShiftTransformUnit({
		semitones,
		cents: options?.cents,
		binaryPath: options?.binaryPath,
		id: options?.id,
	});
}
