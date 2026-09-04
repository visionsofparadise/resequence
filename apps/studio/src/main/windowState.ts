import fs from "node:fs/promises";
import path from "node:path";
import { screen } from "electron";
import { DEFAULT_APP_SETTINGS } from "../shared/models/AppSettings";
import type { AppSettings } from "../shared/models/AppSettings";
import type { BrowserWindow } from "electron";

export async function readSettings(userData: string): Promise<AppSettings> {
	const settingsPath = path.join(userData, "settings.json");

	try {
		const content = await fs.readFile(settingsPath, "utf-8");
		const parsed = JSON.parse(content) as Partial<AppSettings>;

		return { ...DEFAULT_APP_SETTINGS, ...parsed };
	} catch {
		return DEFAULT_APP_SETTINGS;
	}
}

export function restoreWindowState(win: BrowserWindow, settings: AppSettings): void {
	const saved = settings.windowState;

	if (!saved) return;

	const displays = screen.getAllDisplays();

	const isOnDisplay = displays.some((display) => {
		const { x, y, width, height } = display.workArea;

		return saved.x >= x && saved.y >= y && saved.x + saved.width <= x + width && saved.y + saved.height <= y + height;
	});

	if (!isOnDisplay) return;

	win.setBounds({ x: saved.x, y: saved.y, width: saved.width, height: saved.height });
}
