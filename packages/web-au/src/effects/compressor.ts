import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";
import { Unit, driveParam } from "@resequence/web-au-core";

export interface CompressorProperties extends UnitProperties {
	readonly threshold: number;
	readonly knee?: number;
	readonly ratio: number;
	readonly attack?: number;
	readonly release?: number;
}

export class CompressorEffectUnit extends Unit {
	readonly type = ["unit", "compressor"] as const;

	static override is(value: unknown): value is CompressorEffectUnit {
		return Unit.is(value) && value.type[1] === "compressor";
	}

	declare readonly properties: CompressorProperties;
	public compressorNode: DynamicsCompressorNode | undefined;

	constructor(properties: UnitInput<CompressorProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get threshold(): number { return this.properties.threshold; }
	get knee(): number | undefined { return this.properties.knee; }
	get ratio(): number { return this.properties.ratio; }
	get attack(): number | undefined { return this.properties.attack; }
	get release(): number | undefined { return this.properties.release; }

	protected override _setup(context: UnitContext): SetupResult {
		const compressorNode = context.audioContext.createDynamicsCompressor();

		driveParam(compressorNode.threshold, this.id ? `${this.id}.threshold` : undefined, this.threshold, [-100, 0], context);
		driveParam(compressorNode.ratio, this.id ? `${this.id}.ratio` : undefined, this.ratio, [1, 20], context);

		if (this.knee !== undefined) compressorNode.knee.value = this.knee;
		if (this.attack !== undefined) compressorNode.attack.value = this.attack / 1000;
		if (this.release !== undefined) compressorNode.release.value = this.release / 1000;

		this.compressorNode = compressorNode;

		return { entries: [compressorNode], exits: [compressorNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.compressorNode = undefined;
	}
}

export function compressor({ threshold, knee, ratio, attack, release, id }: { threshold: number; knee?: number; ratio: number; attack?: number; release?: number; id?: string }): CompressorEffectUnit {
	return new CompressorEffectUnit({ threshold, knee, ratio, attack, release, id });
}

export function limiter({ threshold = -3, release = 100, id }: { threshold?: number; release?: number; id?: string } = {}): CompressorEffectUnit {
	return new CompressorEffectUnit({ threshold, knee: 0, ratio: 100, attack: 1, release, id });
}
