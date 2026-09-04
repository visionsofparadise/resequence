import path from "path";
import { app, BrowserWindow } from "electron";
import { createWinston } from "../shared/models/Logger/createWinston";
import { Logger } from "../shared/models/Logger/Logger";
import { createWindow } from "./createWindow";

Logger.level = "debug";

// eslint-disable-next-line @typescript-eslint/no-require-imports
if (require("electron-squirrel-startup")) {
	app.quit();
}

const logsDir = path.join(app.getPath("userData"), "logs");
const winston = createWinston(logsDir);
const logger = new Logger("main", winston);

app.on("ready", () => {
	const transactionId = Logger.generateTransactionId();

	logger.info("Application starting", { namespace: "app", transactionId, action: "appReady" });

	createWindow({ logger, winston }).catch((error: unknown) => {
		logger.error("Failed to create window", error as Error, { namespace: "app", transactionId });
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow({ logger, winston }).catch((error: unknown) => {
			logger.error("Failed to create window", error as Error, { namespace: "app" });
		});
	}
});
