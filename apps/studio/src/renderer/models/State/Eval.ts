import type { State } from ".";
import { useCreateState } from "../ProxyStore/hooks/useCreateState";
import type { ProxyStore } from "../ProxyStore/ProxyStore";

export interface EvalState extends State {
	tree: unknown;
	error: string | null;
}

export function useEvalState(store: ProxyStore) {
	return useCreateState<EvalState>({ tree: null, error: null }, store);
}
