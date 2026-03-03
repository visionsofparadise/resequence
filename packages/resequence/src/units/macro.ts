import type { ScheduleContext } from "../rendering/schedule-context";
import { driveParam } from "../utils/driver";
import { Unit, type SetupResult, type UnitInput, type UnitProperties } from "./unit";

export interface MacroProperties extends UnitProperties {
	readonly value: number;
}

export class MacroUnit extends Unit {
	readonly type = ["unit", "macro"] as const;
	readonly properties: MacroProperties;

	static is(value: unknown): value is MacroUnit {
		return Unit.is(value) && value.type[1] === "macro";
	}

	get value(): number {
		return this.properties.value;
	}

	private constantNode: ConstantSourceNode | undefined;

	constructor(properties: UnitInput<MacroProperties>) {
		if (!properties.id) throw new Error("MacroUnit requires an id");
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	clone(overrides?: Partial<MacroProperties>): MacroUnit {
		return new MacroUnit({ ...this.properties, ...overrides });
	}

	protected _setup(context: ScheduleContext): SetupResult {
		const constantNode = context.audioContext.createConstantSource();

		driveParam(constantNode.offset, `${this.id}.value`, this.value, [0, 1], context);

		constantNode.start();

		this.constantNode = constantNode;

		return { exits: [constantNode] };
	}

	protected _teardown(_context: ScheduleContext): void {
		this.constantNode?.stop();
		this.constantNode?.disconnect();
		this.constantNode = undefined;
	}
}

export function macro(value: number, { id }: { id: string }): MacroUnit {
	return new MacroUnit({ value, id });
}
