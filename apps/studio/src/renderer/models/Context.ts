import type { QueryClient } from "@tanstack/react-query";
import type { TempoMap } from "@resequence/patterns";
import type { Unit } from "@resequence/sync-units";
import type { Playback, Router } from "resequence";
import type { Snapshot } from "valtio";
import type { AppSettings } from "../../shared/models/AppSettings";
import type { Logger } from "../../shared/models/Logger/Logger";
import type { DerivedDriverMap } from "../components/Project/Build/utils/hijackDrivers";
import type { Arrangement } from "../components/Project/Build/utils/buildArrangement";
import type { MainWithEvents } from "./Main";
import type { ProxyStore } from "./ProxyStore/ProxyStore";
import type { AppState } from "./State/App";
import type { BuildState } from "./State/Build";
import type { HistoryState } from "./State/History";
import type { OverrideEntry, OverrideState } from "./State/Override";
import type { PlaybackState } from "./State/Playback";
import type { ProjectState } from "./State/Project";

export interface AppContext {
	readonly appSettings: AppSettings;
	readonly app: Snapshot<AppState>;
	readonly appStore: ProxyStore;
	readonly currentProjectPath: string | undefined;
	readonly setCurrentProjectPath: (path: string | undefined) => void;
	readonly logger: Logger;
	readonly main: MainWithEvents;
	readonly queryClient: QueryClient;
	readonly windowId: string;
}

export interface ProjectContext extends AppContext {
	readonly currentProjectPath: string;
	readonly build: Snapshot<BuildState>;
	readonly history: HistoryState;
	readonly override: Snapshot<OverrideState>;
	readonly playback: Snapshot<PlaybackState>;
	readonly project: Snapshot<ProjectState>;
	readonly projectStore: ProxyStore;
}

export interface BuildContext extends ProjectContext {
	readonly arrangement: Arrangement;
	readonly audioContext: AudioContext;
	readonly injectedNodes: WeakSet<object>;
	readonly injectedUnits: Map<string, Unit>;
	readonly overrides: Array<OverrideEntry>;
	readonly playbackEngine: Playback;
	readonly router: Router;
	readonly tempoMap: TempoMap;
	readonly unitDriverMap: DerivedDriverMap;
}
