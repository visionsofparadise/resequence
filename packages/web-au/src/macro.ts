import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";
import { driveParam, Unit } from "@resequence/web-au-core";

export interface MacroProperties extends UnitProperties {
	readonly value: number;
	readonly previousProperties?: MacroProperties;
}

export class MacroUnit extends Unit {
	readonly type = ["unit", "macro"] as const;
	declare readonly properties: MacroProperties;

	static override is(value: unknown): value is MacroUnit {
		return Unit.is(value) && value.type[1] === "macro";
	}

	get value(): number { return this.properties.value; }

	private constantNode: ConstantSourceNode | undefined;

	constructor(properties: UnitInput<MacroProperties>) {
		if (!properties.id) throw new Error("MacroUnit requires an id");

		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	clone(overrides?: Partial<MacroProperties>): MacroUnit {
		return new MacroUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override _setup(context: UnitContext): SetupResult {
		const constantNode = context.audioContext.createConstantSource();

		driveParam(constantNode.offset, `${this.id}.value`, this.value, [0, 1], context);

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
