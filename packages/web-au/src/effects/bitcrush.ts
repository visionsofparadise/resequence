import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit, driveParam, live } from "@resequence/web-au-core";
import { z } from "zod";

const bitcrushSchema = z.object({
	bits: live(z.number().min(1).max(16).default(8).describe("Bit Depth")),
});

export class BitcrushEffectUnit extends Unit<typeof bitcrushSchema> {
	readonly type = ["unit", "bitcrush"] as const;

	static override is(value: unknown): value is BitcrushEffectUnit {
		return Unit.is(value) && value.type[1] === "bitcrush";
	}


	public bitcrushNode: AudioWorkletNode | undefined;

	constructor(input: z.infer<typeof bitcrushSchema> & UnitInput) {
		super(input, bitcrushSchema);
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		await context.loadModule(new URL("../processors/bitcrush-processor.js", import.meta.url).href);

		const bitcrushNode = new AudioWorkletNode(context.audioContext, "bitcrush-processor");

		bitcrushNode.parameters.forEach((param, name) => {
			if (name === "bits") driveParam(param, this.parameters.bits, undefined, context);
		});

		this.bitcrushNode = bitcrushNode;

		return { entries: [bitcrushNode], exits: [bitcrushNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.bitcrushNode = undefined;
	}
}

export function bitcrush({ bits, id }: { bits: number; id?: string }): BitcrushEffectUnit {
	return new BitcrushEffectUnit({ bits, id });
}
