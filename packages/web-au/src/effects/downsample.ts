import { Unit, driveParam, live } from "@resequence/web-au-core";
import { z } from "zod";
import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";

const downsampleSchema = z.object({
	rate: live(z.number().min(100).max(44100).default(22050).describe("Target Rate")),
});

export class DownsampleEffectUnit extends Unit<typeof downsampleSchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "downsample";

	public downsampleNode: AudioWorkletNode | undefined;

	constructor(input: z.infer<typeof downsampleSchema> & UnitInput) {
		super(input, downsampleSchema);
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		await context.loadModule(new URL("../processors/downsample-processor.js", import.meta.url).href);

		const downsampleNode = new AudioWorkletNode(context.audioContext, "downsample-processor");

		downsampleNode.parameters.forEach((param, name) => {
			if (name === "targetRate") driveParam(param, this.parameters.rate, undefined, context);
		});

		this.downsampleNode = downsampleNode;

		return { entries: [downsampleNode], exits: [downsampleNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.downsampleNode = undefined;
	}
}

export function downsample({ rate, id }: { rate: number; id?: string }): DownsampleEffectUnit {
	return new DownsampleEffectUnit({ rate, id });
}

export const sampleRate = downsample;
