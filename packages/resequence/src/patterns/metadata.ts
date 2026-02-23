import type { ScheduleContext } from "../rendering/schedule-context";
import type { Pattern, PositionedNote } from "./pattern";

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

	getMidi(offset = 0, trackName?: string): Array<PositionedNote> {
		return this.node.getMidi(offset, trackName);
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		this.node.schedule(offsetTicks, context);
	}
}

export function metadata(pattern: Pattern, config: { tempo?: number; key?: string; timeSignature?: [number, number] }): MetadataPattern {
	return new MetadataPattern(pattern, config.tempo, config.key, config.timeSignature);
}
