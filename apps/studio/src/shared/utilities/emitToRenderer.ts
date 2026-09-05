import type { WindowState } from "../models/AppSettings";
import type { BrowserWindow } from "electron";

export interface MainEventMap {
	change: [];
	error: [message: string];
	windowBoundsChanged: [windowState: WindowState];
}

export interface RendererEventMap {
	error: [message: string];
}

export const emitToRenderer = <K extends keyof MainEventMap>(
	browserWindow: BrowserWindow,
	channel: K,
	...args: MainEventMap[K]
): void => {
	browserWindow.webContents.send(channel, ...args);
};
