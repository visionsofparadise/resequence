import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { UnitContext } from "../context";
import type { WavBitDepth } from "../rendering/encode-wav";
import { encodeWav } from "../rendering/encode-wav";
import type { SetupResult, UnitInput, UnitProperties } from "../unit";
import { Unit } from "../unit";

export interface WriteProperties extends UnitProperties {
	readonly path: string;
	readonly bitDepth: WavBitDepth;
	readonly previousProperties?: WriteProperties;
}

export class WriteUnit extends Unit {
	readonly type = ["unit", "target", "write"] as const;

	static override is(value: unknown): value is WriteUnit {
		return Unit.is(value) && value.type[1] === "target" && value.type[2] === "write";
	}

	declare readonly properties: WriteProperties;
	private offlineContext: OfflineAudioContext | undefined;

	constructor(properties: UnitInput<WriteProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get path(): string {
		return this.properties.path;
	}

	get bitDepth(): WavBitDepth {
		return this.properties.bitDepth;
	}

	clone(overrides?: Partial<WriteProperties>): WriteUnit {
		return new WriteUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
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

	protected override async _play(context: UnitContext): Promise<void> {
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
