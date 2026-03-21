import { AsyncMainIpc, type IpcHandlerDependencies } from "../../../models/AsyncMainIpc";
import { closeProjectWatcher } from "../../../../main/projectWatcher";
import { CLOSE_WATCHER_ACTION, type CloseWatcherIpcParameters, type CloseWatcherIpcReturn } from "./Renderer";

export class CloseWatcherMainIpc extends AsyncMainIpc<CloseWatcherIpcParameters, CloseWatcherIpcReturn> {
	action = CLOSE_WATCHER_ACTION;

	async handler(_dependencies: IpcHandlerDependencies): Promise<CloseWatcherIpcReturn> {
		await closeProjectWatcher();

		return undefined;
	}
}
