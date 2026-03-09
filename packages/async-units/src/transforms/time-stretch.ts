import type { StreamContext } from "../unit";
import { FfmpegTransformUnit, type FfmpegTransformProperties } from "./ffmpeg";
import type { AsyncUnitInput } from "../unit";

export interface TimeStretchProperties extends FfmpegTransformProperties {
	readonly rate: number;
}

export class TimeStretchTransformUnit extends FfmpegTransformUnit {
	readonly type = ["async-unit", "transform", "ffmpeg", "time-stretch"] as const;

	declare readonly properties: TimeStretchProperties;

	constructor(properties: AsyncUnitInput<TimeStretchProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [] };
	}

	protected _buildArgs(_context: StreamContext): Array<string> {
		const filters = buildAtempoChain(this.properties.rate);
		return ["-af", filters.join(",")];
	}

	clone(overrides?: Partial<TimeStretchProperties>): TimeStretchTransformUnit {
		return new TimeStretchTransformUnit({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

function buildAtempoChain(rate: number): Array<string> {
	const filters: Array<string> = [];
	let remaining = rate;

	while (remaining > 2.0) {
		filters.push("atempo=2.0");
		remaining /= 2.0;
	}

	while (remaining < 0.5) {
		filters.push("atempo=0.5");
		remaining /= 0.5;
	}

	filters.push(`atempo=${remaining}`);

	return filters;
}

export function timeStretch(rate: number, options?: {
	binaryPath?: string;
	id?: string;
}): TimeStretchTransformUnit {
	return new TimeStretchTransformUnit({
		rate,
		binaryPath: options?.binaryPath,
		id: options?.id,
	});
}
