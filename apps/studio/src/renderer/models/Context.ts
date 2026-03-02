import type { QueryClient } from "@tanstack/react-query";
import type { AppSettings } from "../../shared/models/AppSettings";
import type { Logger } from "../../shared/models/Logger/Logger";
import type { MainWithEvents } from "./Main";

export interface AppContext {
	readonly appSettings: AppSettings;
	readonly currentProjectPath: string | undefined;
	readonly setCurrentProjectPath: (path: string | undefined) => void;
	readonly logger: Logger;
	readonly main: MainWithEvents;
	readonly queryClient: QueryClient;
	readonly windowId: string;
}
