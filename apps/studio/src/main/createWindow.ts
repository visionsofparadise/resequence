import { BrowserWindow } from "electron";
import path from "path";
import type winston from "winston";
import { ASYNC_MAIN_IPCS } from "../shared/ipc/asyncMainIpcs";
import type { IpcHandlerDependencies } from "../shared/models/AsyncMainIpc";
import { interceptRendererLogs } from "../shared/models/Logger/interceptRendererLogs";
import { Logger } from "../shared/models/Logger/Logger";
import { getContentSecurityPolicy } from "./getContentSecurityPolicy";

export interface WindowFactoryDependencies {
	readonly logger: Logger;
	readonly winston: winston.Logger;
}

const WINDOW_CONFIG = {
	width: 1200,
	height: 800,
	minWidth: 400,
	minHeight: 300,
	titleBarStyle: "hidden" as const,
	titleBarOverlay: {
		color: "#121418",
		symbolColor: "#e0e5ed",
		height: 44,
	},
};

export const createWindow = (dependencies: WindowFactoryDependencies): BrowserWindow => {
	const { logger, winston } = dependencies;

	const transactionId = Logger.generateTransactionId();

	logger.info("Creating main window", { namespace: "window", transactionId, action: "createWindow" });

	const browserWindow = new BrowserWindow({
		...WINDOW_CONFIG,
		show: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	const isDev = process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL !== undefined;

	browserWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				"Content-Security-Policy": [getContentSecurityPolicy(isDev)],
			},
		});
	});

	const windowId = crypto.randomUUID();

	const ipcDependencies: IpcHandlerDependencies = {
		browserWindow,
		logger,
		winston,
		windowId,
	};

	for (const AsyncMainIpc of ASYNC_MAIN_IPCS) {
		new AsyncMainIpc().register(ipcDependencies);
	}

	logger.info("IPC handlers registered for window", { namespace: "window", transactionId, count: String(ASYNC_MAIN_IPCS.length) });

	interceptRendererLogs(transactionId, { browserWindow, winston });
	logger.info("Renderer log interception initialized", { namespace: "window", transactionId });

	if (process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		browserWindow.loadURL(process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL).catch((error: unknown) => {
			logger.error("Failed to load dev server URL", error as Error, {
				namespace: "window",
				transactionId,
				url: process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL,
			});
		});

		logger.debug("Loaded dev server URL", { namespace: "window", transactionId, url: process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL });
	} else {
		const filePath = path.join(__dirname, `../../renderer/${process.env.MAIN_WINDOW_VITE_NAME}/index.html`);

		logger.debug("Loading file", { namespace: "window", transactionId, filePath });

		browserWindow.loadFile(filePath).catch((error: unknown) => {
			logger.error("Failed to load file", error as Error, { namespace: "window", transactionId, filePath });
		});
	}

	browserWindow.on("ready-to-show", () => {
		logger.info("Main window ready to show", { namespace: "window", transactionId });

		browserWindow.show();
	});

	return browserWindow;
};
