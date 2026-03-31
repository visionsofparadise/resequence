import { type AnyUnit, Unit } from "./unit";

export function flattenUnits(units: ReadonlyArray<AnyUnit>): ReadonlyArray<AnyUnit> {
	return units.flatMap((unit) => (unit instanceof CompositeUnit ? unit.units : [unit]));
}

export abstract class CompositeUnit extends Unit {
	readonly type = ["unit", "composite"];
	abstract readonly head: AnyUnit;
	abstract readonly units: ReadonlyArray<AnyUnit>;

	static override is(value: unknown): value is CompositeUnit {
		return Unit.is(value) && value.type[1] === "composite";
	}
}
