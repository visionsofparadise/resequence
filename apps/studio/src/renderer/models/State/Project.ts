import type { State } from ".";
import { useCreateState } from "../ProxyStore/hooks/useCreateState";
import type { ProxyStore } from "../ProxyStore/ProxyStore";

export interface ProjectState extends State {
	canvasX: number;
	canvasY: number;
	zoom: number;
	sidebarTab: "navigation" | "overrides";
}

export function useProjectState(initial: Partial<ProjectState> = {}, store: ProxyStore) {
	return useCreateState<ProjectState>({ canvasX: 0, canvasY: 0, zoom: 1, sidebarTab: "navigation", ...initial }, store);
}
