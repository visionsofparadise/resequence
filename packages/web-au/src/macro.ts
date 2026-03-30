import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { driveParam, Unit, live } from "@resequence/web-au-core";
import { z } from "zod";

const macroSchema = z.object({
	value: live(z.number().min(0).max(1).default(0).describe("Value")),
});

export class MacroUnit extends Unit<typeof macroSchema> {
	readonly type = ["unit", "macro"] as const;

	static override is(value: unknown): value is MacroUnit {
		return Unit.is(value) && value.type[1] === "macro";
	}


	private constantNode: ConstantSourceNode | undefined;

	constructor(input: z.infer<typeof macroSchema> & UnitInput) {
		if (!input.id) throw new Error("MacroUnit requires an id");

		super(input, macroSchema);
	}

	protected override _setup(context: UnitContext): SetupResult {
		const constantNode = context.audioContext.createConstantSource();

		driveParam(constantNode.offset, this.parameters.value, undefined, context);

		constantNode.start();

		this.constantNode = constantNode;

		return { exits: [constantNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.constantNode?.stop();
		this.constantNode?.disconnect();
		this.constantNode = undefined;
	}
}

export function macro(value: number, { id }: { id: string }): MacroUnit {
	return new MacroUnit({ value, id });
}
