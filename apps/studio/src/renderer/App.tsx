import { MutationCache, QueryCache, QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { Logger } from "../shared/models/Logger/Logger";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Home } from "./components/Home";
import { ProjectLoader } from "./components/Project/Loader";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "./components/ui/sonner";
import { useWindowState } from "./hooks/useWindowState";
import type { AppContext } from "./models/Context";
import { MainEvents } from "./models/MainEvents";
import { ProxyStore } from "./models/ProxyStore/ProxyStore";
import { useAppState } from "./models/State/App";
import { APP_SETTINGS_QUERY_KEY, getAppSettings } from "./utils/appSettings";

const logger = new Logger("renderer");

Logger.level = "debug";

const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			logger.error("Query failed", error, {
				namespace: "ui",
				queryKey: JSON.stringify(query.queryKey),
			});
		},
	}),
	mutationCache: new MutationCache({
		onError: (error, _variables, _context, mutation) => {
			logger.error("Mutation failed", error, {
				namespace: "ui",
				mutationKey: mutation.options.mutationKey ? JSON.stringify(mutation.options.mutationKey) : undefined,
			});
		},
	}),
	defaultOptions: {
		queries: {
			staleTime: 0,
			gcTime: 1000 * 60 * 5,
			retry: 1,
		},
	},
});

export const App: React.FC = () => {
	const [currentProjectPath, setCurrentProjectPath] = useState<string | undefined>();

	const appStore = useMemo(() => new ProxyStore(), []);

	const main = useMemo(
		() => ({
			...window.main,
			events: new MainEvents(window.main),
		}),
		[],
	);

	const app = useAppState(appStore);

	const { data: appSettings } = useQuery(
		{
			queryKey: APP_SETTINGS_QUERY_KEY,
			queryFn: () => getAppSettings(main),
			staleTime: Infinity,
		},
		queryClient,
	);

	useWindowState(app, appStore, appSettings, main, queryClient);

	const { data: windowId } = useQuery(
		{
			queryKey: ["windowId"],
			queryFn: () => main.getWindowId(),
			staleTime: Infinity,
		},
		queryClient,
	);

	const context = useMemo(
		(): AppContext | undefined => (appSettings && windowId ? { appSettings, app, appStore, currentProjectPath, setCurrentProjectPath, logger, main, queryClient, windowId } : undefined),
		[appSettings, app, appStore, currentProjectPath, main, windowId],
	);

	if (!context) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="animate-pulse text-muted-foreground">Loading...</div>
			</div>
		);
	}

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider context={context}>
				<ErrorBoundary>
					{currentProjectPath ? (
						<ProjectLoader
							currentProjectPath={currentProjectPath}
							context={context}
						/>
					) : (
						<Home context={context} />
					)}
					<Toaster />
				</ErrorBoundary>
			</ThemeProvider>
		</QueryClientProvider>
	);
};
