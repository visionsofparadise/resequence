import type { State } from ".";
import { useCreateState } from "../ProxyStore/hooks/useCreateState";
import type { ProxyStore } from "../ProxyStore/ProxyStore";

export interface PatternOverrideEntry {
	domain: "pattern";
	path: Array<{ index: number; type: string }>;
	action: string;
}

export interface UnitOverrideEntry {
	domain: "unit";
	port: string;
	path: Array<{ index: number; type: string }>;
	action: string;
}

export type OverrideEntry = PatternOverrideEntry | UnitOverrideEntry;

export interface OverrideState extends State {
	entries: Array<OverrideEntry>;
}

export function useOverrideState(initial: Partial<OverrideState> = {}, store: ProxyStore) {
	return useCreateState<OverrideState>({ entries: [], ...initial }, store);
}
