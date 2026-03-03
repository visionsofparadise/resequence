import type { BrowserWindow } from "electron";
import type { WindowState } from "../models/AppSettings";

export interface MainEventMap {
	change: [];
	error: [message: string];
	windowBoundsChanged: [windowState: WindowState];
}

export const emitToRenderer = <K extends keyof MainEventMap>(browserWindow: BrowserWindow, channel: K, ...args: MainEventMap[K]): void => {
	browserWindow.webContents.send(channel, ...args);
};

export const getValidEventChannels = (): Array<keyof MainEventMap> => ["change", "error", "windowBoundsChanged"];
