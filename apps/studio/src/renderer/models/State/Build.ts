import type { State } from ".";
import { useCreateState } from "../ProxyStore/hooks/useCreateState";
import type { ProxyStore } from "../ProxyStore/ProxyStore";

export interface BuildState extends State {
	error: string | null;
	buildPath: string | null;
	hoveredPattern: string | null;
}

export function useBuildState(store: ProxyStore) {
	return useCreateState<BuildState>({ error: null, buildPath: null, hoveredPattern: null }, store);
}
