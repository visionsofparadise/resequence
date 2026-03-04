import { execFile } from "node:child_process";
import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { app } from "electron";
import { getAudiowaveformPath } from "../../../../main/getBinaryPath";
import { hashFile } from "../../../../main/hashFile";
import { AsyncMainIpc, type IpcHandlerDependencies } from "../../../models/AsyncMainIpc";
import { GENERATE_WAVEFORM_ACTION, type GenerateWaveformIpcParameters, type GenerateWaveformIpcReturn } from "./Renderer";

const execFileAsync = promisify(execFile);

export class GenerateWaveformMainIpc extends AsyncMainIpc<GenerateWaveformIpcParameters, GenerateWaveformIpcReturn> {
	action = GENERATE_WAVEFORM_ACTION;

	async handler(absolutePath: string, dependencies: IpcHandlerDependencies): Promise<GenerateWaveformIpcReturn> {
		const { logger } = dependencies;

		const hash = await hashFile(absolutePath);
		const waveformsDir = path.join(app.getPath("userData"), "waveforms");
		const cachePath = path.join(waveformsDir, `${hash}.dat`);

		const cached = await stat(cachePath).catch(() => null);
		if (cached) {
			logger.debug("Waveform cache hit", { namespace: "waveform", absolutePath, cachePath });
			const buffer = await readFile(cachePath);
			return new Uint8Array(buffer);
		}

		await mkdir(waveformsDir, { recursive: true });

		const audiowaveformPath = getAudiowaveformPath();
		logger.debug("Generating waveform", { namespace: "waveform", absolutePath, cachePath, audiowaveformPath });

		const { stderr } = await execFileAsync(audiowaveformPath, [
			"-i", absolutePath,
			"-o", cachePath,
			"--output-format", "dat",
			"--pixels-per-second", "8192",
			"--split-channels",
		]);

		if (stderr) {
			logger.debug("audiowaveform stderr", { namespace: "waveform", stderr });
		}

		const buffer = await readFile(cachePath);
		return new Uint8Array(buffer);
	}
}
