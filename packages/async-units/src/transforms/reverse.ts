import type { StreamContext } from "../unit";
import { FfmpegTransformUnit, type FfmpegTransformProperties } from "./ffmpeg";
import type { AsyncUnitInput } from "../unit";

export class ReverseTransformUnit extends FfmpegTransformUnit {
	readonly type = ["async-unit", "transform", "ffmpeg", "reverse"] as const;

	declare readonly properties: FfmpegTransformProperties;

	constructor(properties?: AsyncUnitInput<FfmpegTransformProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties?.targets ?? [] };
	}

	protected _buildArgs(_context: StreamContext): Array<string> {
		return ["-af", "areverse"];
	}

	clone(overrides?: Partial<FfmpegTransformProperties>): ReverseTransformUnit {
		return new ReverseTransformUnit({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function reverse(options?: {
	binaryPath?: string;
	id?: string;
}): ReverseTransformUnit {
	return new ReverseTransformUnit({
		binaryPath: options?.binaryPath,
		id: options?.id,
	});
}
