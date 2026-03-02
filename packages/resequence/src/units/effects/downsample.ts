import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import type { SetupResult } from "../unit";
import { Unit } from "../unit";

export class DownsampleEffectUnit extends Unit {
	readonly type = ["unit", "downsample"] as const;

	static is(value: unknown): value is DownsampleEffectUnit {
		return Unit.is(value) && value.type[1] === "downsample";
	}

	public downsampleNode: AudioWorkletNode | undefined;

	constructor(
		private readonly rate: number,
		public readonly id?: string,
	) {
		super();
	}

	protected async _setup(context: ScheduleContext): Promise<SetupResult> {
		await context.loadModule(new URL("./downsample-processor.js", import.meta.url).href);

		const downsampleNode = new AudioWorkletNode(context.audioContext, "downsample-processor");

		downsampleNode.parameters.forEach((param, name) => {
			if (name === "targetRate") driveParam(param, this.id ? `${this.id}.rate` : undefined, this.rate, [100, 44100], context);
		});

		this.downsampleNode = downsampleNode;
		return { entries: [downsampleNode], exits: [downsampleNode] };
	}

	protected _teardown(_context: ScheduleContext): void {
		this.downsampleNode = undefined;
	}
}

export function downsample({ rate, id }: { rate: number; id?: string }): DownsampleEffectUnit {
	return new DownsampleEffectUnit(rate, id);
}

export const sampleRate = downsample;
