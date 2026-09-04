import type { MainEvents } from "./MainEvents";
import type { AsyncIpcAction, AsyncIpcParameters, AsyncIpcReturn } from "../../shared/ipc/asyncRendererIpcs";
import type { MainEventMap, RendererEventMap } from "../../shared/utilities/emitToRenderer";
import type { IpcRendererEvent } from "electron";

type MainListener<K extends keyof MainEventMap> = (event: IpcRendererEvent, ...parameters: MainEventMap[K]) => void;

export type Main = {
	[K in AsyncIpcAction]: (...data: AsyncIpcParameters<K>) => Promise<AsyncIpcReturn<K>>;
} & {
	events: {
		on: <K extends keyof MainEventMap>(eventName: K, listener: MainListener<K>) => void;
		removeListener: <K extends keyof MainEventMap>(eventName: K, listener: MainListener<K>) => void;
	};

	send: <K extends keyof RendererEventMap>(channel: K, ...args: RendererEventMap[K]) => void;

	getPathForFile: (file: File) => string;
};

export type MainWithEvents = Omit<Main, "events"> & {
	events: MainEvents;
};

export const main = window.main;

declare global {
	interface Window {
		main: Main;
	}
}
