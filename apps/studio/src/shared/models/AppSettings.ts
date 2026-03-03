export interface RecentProject {
	readonly name: string;
	readonly path: string;
	readonly lastOpenedAt: number;
}

export type Theme = "light" | "dark" | "system";

export interface WindowState {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
	readonly maximized: boolean;
}

export interface AppSettings {
	readonly recentProjects: Array<RecentProject>;
	readonly lastProjectPath: string | undefined;
	readonly theme: Theme;
	readonly windowState?: WindowState;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
	recentProjects: [],
	lastProjectPath: undefined,
	theme: "system",
};
