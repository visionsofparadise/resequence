import type { IpcRendererEvent } from "electron";
import EventEmitter from "events";
import type { MainEventMap } from "../../shared/utilities/emitToRenderer";
import type { Main } from "./Main";

export class MainEvents extends EventEmitter<MainEventMap> {
	constructor(main: Main) {
		super();

		main.events.on("error", (_: IpcRendererEvent, ...args) => {
			this.emit("error", ...args);
		});
	}
}
