import type { Pattern } from "resequence";
import type { State } from ".";
import { useCreateState } from "../ProxyStore/hooks/useCreateState";
import type { ProxyStore } from "../ProxyStore/ProxyStore";

export interface BuildState extends State {
	tree: Pattern | null;
	error: string | null;
	buildPath: string | null;
}

export function useBuildState(store: ProxyStore) {
	return useCreateState<BuildState>({ tree: null, error: null, buildPath: null }, store);
}
