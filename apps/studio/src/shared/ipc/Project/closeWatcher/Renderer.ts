import { AsyncRendererIpc } from "../../../models/AsyncRendererIpc";

export type CloseWatcherIpcParameters = [];
export type CloseWatcherIpcReturn = undefined;
export const CLOSE_WATCHER_ACTION = "closeWatcher" as const;

export class CloseWatcherRendererIpc extends AsyncRendererIpc<typeof CLOSE_WATCHER_ACTION, CloseWatcherIpcParameters, CloseWatcherIpcReturn> {
	action = CLOSE_WATCHER_ACTION;
}
