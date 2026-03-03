import type { QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { AppSettings, WindowState } from "../../shared/models/AppSettings";
import type { MainWithEvents } from "../models/Main";
import type { ProxyStore } from "../models/ProxyStore/ProxyStore";
import type { AppState } from "../models/State/App";
import { APP_SETTINGS_QUERY_KEY } from "../utils/appSettings";

export function useWindowState(
	appState: AppState & { readonly _key: symbol },
	appStore: ProxyStore,
	appSettings: AppSettings | undefined,
	main: MainWithEvents,
	queryClient: QueryClient,
): void {
	useEffect(() => {
		if (appSettings?.windowState) {
			appStore.mutate(appState, (st) => Object.assign(st, appSettings.windowState));
		}
	}, [appSettings?.windowState]);

	useEffect(() => {
		const handler = (windowState: WindowState) => {
			void (async () => {
				try {
					const userDataPath = await main.getUserDataPath();
					const settingsPath = `${userDataPath}/settings.json`;
					const existing = queryClient.getQueryData<AppSettings>(APP_SETTINGS_QUERY_KEY) ?? {};
					const merged = { ...(existing as AppSettings), windowState };

					await main.writeFile(settingsPath, JSON.stringify(merged, null, 2));

					queryClient.setQueryData(APP_SETTINGS_QUERY_KEY, merged);
				} catch {
					return;
				}
			})();
		};

		main.events.on("windowBoundsChanged", handler);

		return () => {
			main.events.off("windowBoundsChanged", handler);
		};
	}, [main]);
}
