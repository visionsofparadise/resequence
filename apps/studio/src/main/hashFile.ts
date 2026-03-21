import { createHash } from "node:crypto";
import { open, stat } from "node:fs/promises";

const CHUNK_SIZE = 65536;

export async function hashFile(filePath: string): Promise<string> {
	const fileStat = await stat(filePath);
	const hash = createHash("sha256");

	const handle = await open(filePath, "r");

	try {
		const headBuffer = Buffer.alloc(Math.min(CHUNK_SIZE, fileStat.size));

		await handle.read(headBuffer, 0, headBuffer.length, 0);
		hash.update(headBuffer);

		if (fileStat.size > CHUNK_SIZE) {
			const tailBuffer = Buffer.alloc(CHUNK_SIZE);

			await handle.read(tailBuffer, 0, CHUNK_SIZE, fileStat.size - CHUNK_SIZE);
			hash.update(tailBuffer);
		}
	} finally {
		await handle.close();
	}

	hash.update(`${fileStat.size}:${fileStat.mtimeMs}`);

	return hash.digest("hex");
}
