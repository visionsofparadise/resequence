import { AsyncRendererIpc } from "../../../models/AsyncRendererIpc";

export type OpenWatcherIpcParameters = [dirPath: string];
export type OpenWatcherIpcReturn = undefined;
export const OPEN_WATCHER_ACTION = "openWatcher" as const;

export class OpenWatcherRendererIpc extends AsyncRendererIpc<typeof OPEN_WATCHER_ACTION, OpenWatcherIpcParameters, OpenWatcherIpcReturn> {
	action = OPEN_WATCHER_ACTION;
}
