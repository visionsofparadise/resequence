import type { StreamContext } from "../unit";
import { FfmpegTransformUnit, type FfmpegTransformProperties } from "./ffmpeg";
import type { AsyncUnitInput } from "../unit";

export interface PadProperties extends FfmpegTransformProperties {
	readonly before?: number;
	readonly after?: number;
	readonly duration?: number;
}

export class PadTransformUnit extends FfmpegTransformUnit {
	readonly type = ["async-unit", "transform", "ffmpeg", "pad"] as const;

	declare readonly properties: PadProperties;

	constructor(properties: AsyncUnitInput<PadProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [] };
	}

	protected _buildArgs(context: StreamContext): Array<string> {
		const { before, after, duration } = this.properties;
		const filters: Array<string> = [];

		if (before !== undefined && before > 0) {
			const delayMs = Math.round(before * 1000);
			const delays = Array.from({ length: context.channels }, () => String(delayMs)).join("|");
			filters.push(`adelay=${delays}:all=0`);
		}

		if (duration !== undefined) {
			filters.push(`apad=whole_dur=${duration}`);
		} else if (after !== undefined && after > 0) {
			const padSamples = Math.round(after * context.sampleRate);
			filters.push(`apad=pad_len=${padSamples}`);
		}

		if (filters.length === 0) {
			filters.push("anull");
		}

		return ["-af", filters.join(",")];
	}

	clone(overrides?: Partial<PadProperties>): PadTransformUnit {
		return new PadTransformUnit({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function pad(options: {
	before?: number;
	after?: number;
	duration?: number;
	binaryPath?: string;
	id?: string;
}): PadTransformUnit {
	return new PadTransformUnit({
		before: options.before,
		after: options.after,
		duration: options.duration,
		binaryPath: options.binaryPath,
		id: options.id,
	});
}
