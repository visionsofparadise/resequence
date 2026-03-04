import type { State } from ".";
import { useCreateState } from "../ProxyStore/hooks/useCreateState";
import type { ProxyStore } from "../ProxyStore/ProxyStore";
import { Transient } from "../Transient";

export interface OutputGraphViewport {
	x: number;
	y: number;
	zoom: number;
}

export interface PianoRollTarget {
	sequencePath: Array<number>;
	index: number;
}

export interface OutputTarget {
	index: number;
}

export interface ProjectState extends State {
	activePianoRoll: PianoRollTarget | null;
	activeOutput: OutputTarget | null;

	timelineScrollX: Transient<number>;
	timelineScrollY: Transient<number>;
	timelineZoom: Transient<number>;
	pitchZoom: Transient<number>;

	outputGraphViewports: Record<string, OutputGraphViewport>;

	topHeightPercent: Transient<number>;
	overridesWidthPercent: Transient<number>;
}

export interface ProjectStateInitial {
	activePianoRoll?: PianoRollTarget | null;
	activeOutput?: OutputTarget | null;
	timelineScrollX?: number;
	timelineScrollY?: number;
	timelineZoom?: number;
	pitchZoom?: number;
	outputGraphViewports?: Record<string, OutputGraphViewport>;
	topHeightPercent?: number;
	overridesWidthPercent?: number;
}

export function useProjectState(initial: ProjectStateInitial = {}, store: ProxyStore) {
	return useCreateState<ProjectState>(
		{
			activePianoRoll: initial.activePianoRoll ?? null,
			activeOutput: initial.activeOutput ?? null,
			timelineScrollX: new Transient(initial.timelineScrollX ?? 0),
			timelineScrollY: new Transient(initial.timelineScrollY ?? 0),
			timelineZoom: new Transient(initial.timelineZoom ?? 1),
			pitchZoom: new Transient(initial.pitchZoom ?? 10, { minimum: 2, maximum: 30 }),
			outputGraphViewports: initial.outputGraphViewports ?? {},
			topHeightPercent: new Transient(initial.topHeightPercent ?? 35, { minimum: 10, maximum: 90 }),
			overridesWidthPercent: new Transient(initial.overridesWidthPercent ?? 40, { minimum: 10, maximum: 90 }),
		},
		store,
	);
}

export function serializeProjectState(state: ProjectState): ProjectStateInitial {
	return {
		activePianoRoll: state.activePianoRoll,
		activeOutput: state.activeOutput,
		timelineScrollX: state.timelineScrollX.toJson(),
		timelineScrollY: state.timelineScrollY.toJson(),
		timelineZoom: state.timelineZoom.toJson(),
		pitchZoom: state.pitchZoom.toJson(),
		outputGraphViewports: state.outputGraphViewports,
		topHeightPercent: state.topHeightPercent.toJson(),
		overridesWidthPercent: state.overridesWidthPercent.toJson(),
	};
}

export function deserializeProjectState(json: Record<string, unknown>): ProjectStateInitial {
	return {
		activePianoRoll: isPianoRollTarget(json.activePianoRoll) ? json.activePianoRoll : undefined,
		activeOutput: isOutputTarget(json.activeOutput) ? json.activeOutput : undefined,
		timelineScrollX: typeof json.timelineScrollX === "number" ? json.timelineScrollX : undefined,
		timelineScrollY: typeof json.timelineScrollY === "number" ? json.timelineScrollY : undefined,
		timelineZoom: typeof json.timelineZoom === "number" ? json.timelineZoom : undefined,
		pitchZoom: typeof json.pitchZoom === "number" ? json.pitchZoom : undefined,
		outputGraphViewports: isOutputGraphViewports(json.outputGraphViewports) ? json.outputGraphViewports : undefined,
		topHeightPercent: typeof json.topHeightPercent === "number" ? json.topHeightPercent : undefined,
		overridesWidthPercent: typeof json.overridesWidthPercent === "number" ? json.overridesWidthPercent : undefined,
	};
}

function isPianoRollTarget(value: unknown): value is PianoRollTarget {
	if (typeof value !== "object" || value === null) return false;

	const record = value as Record<string, unknown>;

	if (!Array.isArray(record.sequencePath) || !record.sequencePath.every((item: unknown) => typeof item === "number")) return false;

	if (typeof record.index !== "number") return false;

	return true;
}

function isOutputTarget(value: unknown): value is OutputTarget {
	if (typeof value !== "object" || value === null) return false;

	return typeof (value as Record<string, unknown>).index === "number";
}

function isOutputGraphViewports(value: unknown): value is Record<string, OutputGraphViewport> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return false;

	for (const entry of Object.values(value)) {
		if (typeof entry !== "object" || entry === null) return false;

		const viewport = entry as Record<string, unknown>;

		if (typeof viewport.x !== "number" || typeof viewport.y !== "number" || typeof viewport.zoom !== "number") return false;
	}

	return true;
}
