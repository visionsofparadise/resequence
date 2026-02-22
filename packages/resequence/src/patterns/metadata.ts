import type { Pattern } from "./pattern";

export class MetadataPattern implements Pattern {
	readonly type = "metadata" as const;
	readonly durationTicks: number;

	constructor(
		readonly node: Pattern,
		readonly tempo?: number,
		readonly key?: string,
		readonly timeSignature?: [number, number],
	) {
		this.durationTicks = node.durationTicks;
	}

	transpose(interval: number): MetadataPattern {
		return new MetadataPattern(this.node.transpose(interval), this.tempo, this.key, this.timeSignature);
	}

	reverse(): MetadataPattern {
		return new MetadataPattern(this.node.reverse(), this.tempo, this.key, this.timeSignature);
	}
}

export function metadata(pattern: Pattern, config: { tempo?: number; key?: string; timeSignature?: [number, number] }): MetadataPattern {
	return new MetadataPattern(pattern, config.tempo, config.key, config.timeSignature);
}
