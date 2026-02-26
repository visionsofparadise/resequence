import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import { Unit } from "../unit";

export class DownsampleEffectUnit extends Unit {
	readonly type = "downsample" as const;

	public downsampleNode: AudioWorkletNode | undefined;

	constructor(
		private readonly rate: number,
		public readonly id?: string,
	) {
		super();
	}

	protected _setup(context: ScheduleContext): void {
		const downsampleNode = new AudioWorkletNode(context.audioContext, "downsample-processor");

		downsampleNode.parameters.forEach((param, name) => {
			if (name === "targetRate") driveParam(param, this.id, "rate", this.rate, context);
		});

		this.downsampleNode = downsampleNode;
		this.entryNodes.push(downsampleNode);
		this.exitNodes.push(downsampleNode);
	}

	protected _teardown(_context: ScheduleContext): void {
		this.downsampleNode = undefined;
	}
}

export function downsample({ rate, id }: { rate: number; id?: string }): DownsampleEffectUnit {
	return new DownsampleEffectUnit(rate, id);
}

export const sampleRate = downsample;
