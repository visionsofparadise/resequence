import { openProjectWatcher } from "../../../../main/projectWatcher";
import { AsyncMainIpc, type IpcHandlerDependencies } from "../../../models/AsyncMainIpc";
import { OPEN_WATCHER_ACTION, type OpenWatcherIpcParameters, type OpenWatcherIpcReturn } from "./Renderer";

export class OpenWatcherMainIpc extends AsyncMainIpc<OpenWatcherIpcParameters, OpenWatcherIpcReturn> {
	action = OPEN_WATCHER_ACTION;

	async handler(dirPath: string, dependencies: IpcHandlerDependencies): Promise<OpenWatcherIpcReturn> {
		await openProjectWatcher(dirPath, dependencies.browserWindow);

		return undefined;
	}
}
