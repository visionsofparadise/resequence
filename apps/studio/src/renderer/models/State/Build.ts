import type { Pattern, Unit } from "resequence";
import type { DerivedDriverMap } from "../../audio/hijackDrivers";
import type { State } from ".";
import { useCreateState } from "../ProxyStore/hooks/useCreateState";
import type { ProxyStore } from "../ProxyStore/ProxyStore";

export interface UnitRoot {
	readonly children: ReadonlyArray<Unit>;
}

export interface BuildState extends State {
	tree: Pattern | null;
	unitRoot: UnitRoot | null;
	derivedDrivers: DerivedDriverMap | null;
	error: string | null;
	buildPath: string | null;
}

export function useBuildState(store: ProxyStore) {
	return useCreateState<BuildState>({ tree: null, unitRoot: null, derivedDrivers: null, error: null, buildPath: null }, store);
}
