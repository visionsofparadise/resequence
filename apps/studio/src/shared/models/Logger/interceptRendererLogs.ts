import type { IpcHandlerDependencies } from "../AsyncMainIpc";
import { Logger } from "./Logger";

type ConsoleMessageLevel = 0 | 1 | 2 | 3;

const levelMap: Record<ConsoleMessageLevel, Logger.Level> = {
	0: "debug",
	1: "info",
	2: "warn",
	3: "error",
};

export const interceptRendererLogs = (transactionId: string, dependencies: Pick<IpcHandlerDependencies, "browserWindow" | "winston">) => {
	const { browserWindow, winston } = dependencies;

	const logger = new Logger("renderer", winston);

	const consoleMessageListener = (_event: Electron.Event, level: number, message: string) => {
		let logEntry: Logger.Entry;

		try {
			logEntry = JSON.parse(message) as Logger.Entry;
		} catch {
			const isValidLevel = (lvl: number): lvl is ConsoleMessageLevel => lvl >= 0 && lvl <= 3;
			const mappedLevel = isValidLevel(level) ? levelMap[level] : "info";

			logEntry = logger.createLogEntry(mappedLevel, message);
		}

		logger.log(logEntry);
	};

	browserWindow.webContents.on("console-message", consoleMessageListener);

	return () => {
		try {
			if (!browserWindow.isDestroyed()) {
				logger.info("Closing console message listening", { namespace: "window", transactionId });

				browserWindow.webContents.removeListener("console-message", consoleMessageListener);
			}
		} catch {
			// Window already destroyed during app quit
		}
	};
};
