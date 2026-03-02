import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from "electron";
import { ASYNC_RENDERER_IPCS } from "../shared/ipc/asyncRendererIpcs";
import type { MainEventMap } from "../shared/utilities/emitToRenderer";

export interface RendererEventMap {
	error: [string];
}

const ipcHandlers = ASYNC_RENDERER_IPCS.map((AsyncRendererIpc) => new AsyncRendererIpc().register(ipcRenderer));

const mainApi = {
	...(Object.fromEntries(ipcHandlers) as Record<string, unknown>),

	events: {
		on: <K extends keyof MainEventMap>(eventName: K, listener: (_event: IpcRendererEvent, ...args: MainEventMap[K]) => void) => ipcRenderer.addListener(eventName, listener),
		removeListener: <K extends keyof MainEventMap>(eventName: K, listener: (_event: IpcRendererEvent, ...args: MainEventMap[K]) => void) => ipcRenderer.removeListener(eventName, listener),
	},

	send: <K extends keyof RendererEventMap>(eventName: K, ...args: RendererEventMap[K]) => {
		ipcRenderer.send(eventName, ...args);
	},

	getPathForFile: (file: File) => webUtils.getPathForFile(file),
};

contextBridge.exposeInMainWorld("main", mainApi);
