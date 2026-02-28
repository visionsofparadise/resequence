import type { ScheduleContext } from "../rendering/schedule-context";
import { driveParam } from "../utils/driver";
import { Unit, type SetupResult } from "./unit";

export class MacroUnit extends Unit {
	readonly type = "macro" as const;

	private readonly value: number;
	public readonly id: string;

	private constantNode: ConstantSourceNode | undefined;

	constructor(value: number, id: string) {
		super();
		this.value = value;
		this.id = id;
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
	return new MacroUnit(value, id);
}
