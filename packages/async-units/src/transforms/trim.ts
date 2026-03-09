import type { StreamContext } from "../unit";
import { FfmpegTransformUnit, type FfmpegTransformProperties } from "./ffmpeg";
import type { AsyncUnitInput } from "../unit";

export interface TrimProperties extends FfmpegTransformProperties {
	readonly start?: number;
	readonly end?: number;
	readonly duration?: number;
}

export class TrimTransformUnit extends FfmpegTransformUnit {
	readonly type = ["async-unit", "transform", "ffmpeg", "trim"] as const;

	declare readonly properties: TrimProperties;

	constructor(properties: AsyncUnitInput<TrimProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [] };
	}

	protected _buildArgs(_context: StreamContext): Array<string> {
		const { start, end, duration } = this.properties;
		const parts: Array<string> = [];

		if (start !== undefined) parts.push(`start=${start}`);

		if (end !== undefined) {
			parts.push(`end=${end}`);
		} else if (duration !== undefined) {
			parts.push(`duration=${duration}`);
		}

		return ["-af", `atrim=${parts.join(":")}`];
	}

	clone(overrides?: Partial<TrimProperties>): TrimTransformUnit {
		return new TrimTransformUnit({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function trim(options: {
	start?: number;
	end?: number;
	duration?: number;
	binaryPath?: string;
	id?: string;
}): TrimTransformUnit {
	return new TrimTransformUnit({
		start: options.start,
		end: options.end,
		duration: options.duration,
		binaryPath: options.binaryPath,
		id: options.id,
	});
}
