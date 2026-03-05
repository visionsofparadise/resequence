import { Unit } from "../unit";

export function flattenUnits(units: ReadonlyArray<Unit>): ReadonlyArray<Unit> {
	return units.flatMap((unit) => (unit instanceof Composite ? unit.units : [unit]));
}

export abstract class Composite extends Unit {
	abstract readonly type: readonly ["unit", "composite", ...Array<string>];
	abstract readonly head: Unit;
	abstract readonly units: ReadonlyArray<Unit>;

	static override is(value: unknown): value is Composite {
		return Unit.is(value) && value.type[1] === "composite";
	}
}
