import type { SourceAsyncUnit } from "../source";
import type { TargetAsyncUnit } from "../target";
import type { TransformAsyncUnit } from "../transform";
import type { AsyncUnit } from "../unit";

export function chain<S extends SourceAsyncUnit>(source: S, ...rest: Array<TransformAsyncUnit | TargetAsyncUnit>): S;
export function chain(...units: Array<AsyncUnit>): AsyncUnit;
export function chain(...units: Array<AsyncUnit>): AsyncUnit {
	if (units.length === 0) {
		throw new Error("chain() requires at least one unit");
	}

	for (let index = 0; index < units.length - 1; index++) {
		const current = units[index];
		const next = units[index + 1];
		if (current && next) current.to(next);
	}

	const head = units[0];

	if (!head) throw new Error("chain() requires at least one unit");

	return head;
}
