import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";
import { z } from "zod";

const convolutionSchema = z.object({
	impulse: z.string().describe("Impulse Response Path"),
	normalize: z.boolean().default(true).describe("Normalize").optional(),
});

export class ConvolutionEffectUnit extends Unit<typeof convolutionSchema> {
	readonly type = ["unit", "convolution"] as const;

	static override is(value: unknown): value is ConvolutionEffectUnit {
		return Unit.is(value) && value.type[1] === "convolution";
	}


	public convolverNode: ConvolverNode | undefined;

	constructor(input: z.infer<typeof convolutionSchema> & UnitInput) {
		super(input, convolutionSchema);
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const convolverNode = context.audioContext.createConvolver();

		if (this.parameters.normalize?.value !== undefined) convolverNode.normalize = this.parameters.normalize.value;

		try {
			convolverNode.buffer = await context.getSample(this.parameters.impulse.value);
		} catch {
			// impulse not loadable — skip
		}

		this.convolverNode = convolverNode;

		return { entries: [convolverNode], exits: [convolverNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.convolverNode = undefined;
	}
}

export function convolution({ impulse, normalize }: { impulse: string; normalize?: boolean }): ConvolutionEffectUnit {
	return new ConvolutionEffectUnit({ impulse, normalize });
}
