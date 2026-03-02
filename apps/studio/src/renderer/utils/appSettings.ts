import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type AppSettings, DEFAULT_APP_SETTINGS } from "../../shared/models/AppSettings";
import type { MainWithEvents } from "../models/Main";

const SETTINGS_FILE = "settings.json";

const getSettingsPath = async (main: MainWithEvents): Promise<string> => {
	const userDataPath = await main.getUserDataPath();
	return `${userDataPath}/${SETTINGS_FILE}`;
};

export const APP_SETTINGS_QUERY_KEY = ["appSettings"] as const;

export const getAppSettings = async (main: MainWithEvents): Promise<AppSettings> => {
	const settingsPath = await getSettingsPath(main);

	try {
		const content = await main.readFile(settingsPath);
		const settings = JSON.parse(content) as Partial<AppSettings>;

		return {
			...DEFAULT_APP_SETTINGS,
			...settings,
		};
	} catch {
		const defaultSettings = DEFAULT_APP_SETTINGS;

		await main.writeFile(settingsPath, JSON.stringify(defaultSettings, null, 2));

		return defaultSettings;
	}
};

export const useSetAppSettings = (main: MainWithEvents) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (partialSettings: Partial<AppSettings>) => {
			const settingsPath = await getSettingsPath(main);
			const existingSettings = queryClient.getQueryData<AppSettings>(APP_SETTINGS_QUERY_KEY) ?? DEFAULT_APP_SETTINGS;

			const mergedSettings: AppSettings = {
				...existingSettings,
				...partialSettings,
			};

			await main.writeFile(settingsPath, JSON.stringify(mergedSettings, null, 2));

			return mergedSettings;
		},
		onSuccess: (newSettings) => {
			queryClient.setQueryData(APP_SETTINGS_QUERY_KEY, newSettings);
		},
	});
};
