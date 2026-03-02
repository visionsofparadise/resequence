import type { BrowserWindow } from "electron";

export interface MainEventMap {
	error: [message: string];
}

export const emitToRenderer = <K extends keyof MainEventMap>(browserWindow: BrowserWindow, channel: K, ...args: MainEventMap[K]): void => {
	browserWindow.webContents.send(channel, ...args);
};

export const getValidEventChannels = (): Array<keyof MainEventMap> => ["error"];
