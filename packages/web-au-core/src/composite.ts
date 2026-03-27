import type { UnitContext } from "./context";
import { Unit } from "./unit";

export function flattenUnits(units: ReadonlyArray<Unit>): ReadonlyArray<Unit> {
	return units.flatMap((unit) => (unit instanceof CompositeUnit ? unit.units : [unit]));
}

export abstract class CompositeUnit extends Unit {
	abstract readonly type: readonly ["unit", "composite", ...Array<string>];
	abstract readonly head: Unit;
	abstract readonly units: ReadonlyArray<Unit>;

	static override is(value: unknown): value is CompositeUnit {
		return Unit.is(value) && value.type[1] === "composite";
	}

	protected override _play(context: UnitContext): void | Promise<void> {
		return this.head.play(context);
	}
}
