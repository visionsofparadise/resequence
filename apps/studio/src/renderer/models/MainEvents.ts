import EventEmitter from "events";
import type { Main } from "./Main";
import type { MainEventMap } from "../../shared/utilities/emitToRenderer";
import type { IpcRendererEvent } from "electron";

export class MainEvents extends EventEmitter<MainEventMap> {
	constructor(main: Main) {
		super();

		main.events.on("change", (_: IpcRendererEvent) => {
			this.emit("change");
		});

		main.events.on("error", (_: IpcRendererEvent, ...args) => {
			this.emit("error", ...args);
		});

		main.events.on("windowBoundsChanged", (_: IpcRendererEvent, ...args) => {
			this.emit("windowBoundsChanged", ...args);
		});
	}
}
