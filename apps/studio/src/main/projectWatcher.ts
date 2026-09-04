import chokidar, { type FSWatcher } from "chokidar";
import { emitToRenderer } from "../shared/utilities/emitToRenderer";
import type { BrowserWindow } from "electron";

let watcher: FSWatcher | null = null;

export const openProjectWatcher = async (dirPath: string, browserWindow: BrowserWindow): Promise<void> => {
	await closeProjectWatcher();

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	const emit = (): void => {
		if (debounceTimer) clearTimeout(debounceTimer);

		debounceTimer = setTimeout(() => {
			emitToRenderer(browserWindow, "change");
		}, 200);
	};

	watcher = chokidar.watch(`${dirPath}/**/*.{ts,js}`, {
		ignored: [/(^|[/\\])\../, /node_modules/],
		ignoreInitial: true,
		persistent: true,
	});

	watcher.on("add", emit);
	watcher.on("change", emit);
	watcher.on("unlink", emit);
};

export const closeProjectWatcher = async (): Promise<void> => {
	if (watcher) {
		await watcher.close();
		watcher = null;
	}
};
