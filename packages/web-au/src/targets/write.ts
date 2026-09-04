import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Unit } from "@resequence/web-au-core";
import { encodeWav } from "@resequence/web-au-utils";
import { z } from "zod";
import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import type { WavBitDepth } from "@resequence/web-au-utils";

export class WriteUnit extends Unit {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "write";

	readonly path: string;
	readonly bitDepth: WavBitDepth;
	private offlineContext: OfflineAudioContext | undefined;

	constructor(input: { path: string; bitDepth: WavBitDepth } & UnitInput) {
		super(input, z.object({}));
		this.path = input.path;
		this.bitDepth = input.bitDepth;
	}

	protected override _setup(context: UnitContext): SetupResult {
		const gainNode = context.audioContext.createGain();

		if ("startRendering" in context.audioContext) {
			gainNode.connect(context.audioContext.destination);
			this.offlineContext = context.audioContext as OfflineAudioContext;
		}

		return { entries: [gainNode], exits: [gainNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.offlineContext = undefined;
	}

	async render(context: UnitContext): Promise<void> {
		if (this.offlineContext) {
			const audioBuffer = await this.offlineContext.startRendering();
			const outputPath = resolve(context.basePath, this.path);

			mkdirSync(dirname(outputPath), { recursive: true });

			const wav = encodeWav(audioBuffer, this.bitDepth);

			writeFileSync(outputPath, Buffer.from(wav));
		}
	}
}

export function write({ path, bitDepth, id }: { path: string; bitDepth?: WavBitDepth; id?: string }): WriteUnit {
	return new WriteUnit({ path, bitDepth: bitDepth ?? "24", id });
}
