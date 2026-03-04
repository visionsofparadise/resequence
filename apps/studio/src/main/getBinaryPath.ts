import { app } from "electron";
import path from "path";

const getBinaryPath = (name: string): string => {
	const binDir = app.isPackaged ? path.join(process.resourcesPath, "binaries") : path.join(app.getAppPath(), "binaries", process.platform);

	const ext = process.platform === "win32" ? ".exe" : "";

	return path.join(binDir, `${name}${ext}`);
};

export const getAudiowaveformPath = (): string => getBinaryPath("audiowaveform");
