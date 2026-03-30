import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit, driveParam, live } from "@resequence/web-au-core";
import { z } from "zod";

const panSchema = z.object({
	position: live(z.number().min(-1).max(1).default(0).describe("Pan")),
});

export class PanEffectUnit extends Unit<typeof panSchema> {
	readonly type = ["unit", "pan"] as const;

	static override is(value: unknown): value is PanEffectUnit {
		return Unit.is(value) && value.type[1] === "pan";
	}


	public panNode: StereoPannerNode | undefined;

	constructor(input: z.infer<typeof panSchema> & UnitInput) {
		super(input, panSchema);
	}

	protected override _setup(context: UnitContext): SetupResult {
		const panNode = context.audioContext.createStereoPanner();

		driveParam(panNode.pan, this.parameters.position, undefined, context);

		this.panNode = panNode;

		return { entries: [panNode], exits: [panNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.panNode = undefined;
	}
}

export function pan({ position, id }: { position: number; id?: string }): PanEffectUnit {
	return new PanEffectUnit({ position, id });
}
