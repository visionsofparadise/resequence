import type { MainWithEvents } from "../models/Main";

const ENTRYPOINT_CANDIDATES = ["src/index.ts", "index.ts", "dist/index.js", "index.js"];

export const resolveEntrypoint = async (main: MainWithEvents, dirPath: string): Promise<string | undefined> => {
	for (const candidate of ENTRYPOINT_CANDIDATES) {
		const fullPath = `${dirPath}/${candidate}`;

		try {
			await main.readFile(fullPath);

			return fullPath;
		} catch {
			continue;
		}
	}

	return undefined;
};
