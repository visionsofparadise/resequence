export interface RecentProject {
	readonly name: string;
	readonly path: string;
	readonly lastOpenedAt: number;
}

export type Theme = "light" | "dark" | "system";

export interface AppSettings {
	readonly recentProjects: Array<RecentProject>;
	readonly lastProjectPath: string | undefined;
	readonly theme: Theme;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
	recentProjects: [],
	lastProjectPath: undefined,
	theme: "system",
};
