import type { State } from ".";
import { useCreateState } from "../ProxyStore/hooks/useCreateState";
import type { ProxyStore } from "../ProxyStore/ProxyStore";
import { Transient } from "../Transient";

export interface ProjectState extends State {
	canvasX: Transient<number>;
	canvasY: Transient<number>;
	zoom: Transient<number>;
	sidebarWidthPercent: Transient<number>;
	sidebarTab: "builds" | "nodes" | "overrides";
}

export interface ProjectStateInitial {
	canvasX?: number;
	canvasY?: number;
	zoom?: number;
	sidebarWidthPercent?: number;
	sidebarTab?: "builds" | "nodes" | "overrides";
}

export function useProjectState(initial: ProjectStateInitial = {}, store: ProxyStore) {
	return useCreateState<ProjectState>(
		{
			canvasX: new Transient(initial.canvasX ?? 0),
			canvasY: new Transient(initial.canvasY ?? 0),
			zoom: new Transient(initial.zoom ?? 1),
			sidebarWidthPercent: new Transient(initial.sidebarWidthPercent ?? 20, { minimum: 5 }),
			sidebarTab: initial.sidebarTab ?? "overrides",
		},
		store,
	);
}

export function serializeProjectState(state: ProjectState): ProjectStateInitial {
	return {
		canvasX: state.canvasX.toJson(),
		canvasY: state.canvasY.toJson(),
		zoom: state.zoom.toJson(),
		sidebarWidthPercent: state.sidebarWidthPercent.toJson(),
		sidebarTab: state.sidebarTab,
	};
}

export function deserializeProjectState(json: Record<string, unknown>): ProjectStateInitial {
	return {
		canvasX: typeof json.canvasX === "number" ? json.canvasX : undefined,
		canvasY: typeof json.canvasY === "number" ? json.canvasY : undefined,
		zoom: typeof json.zoom === "number" ? json.zoom : undefined,
		sidebarWidthPercent: typeof json.sidebarWidthPercent === "number" ? json.sidebarWidthPercent : undefined,
		sidebarTab: isValidSidebarTab(json.sidebarTab) ? json.sidebarTab : undefined,
	};
}

function isValidSidebarTab(value: unknown): value is ProjectState["sidebarTab"] {
	return value === "builds" || value === "nodes" || value === "overrides";
}
