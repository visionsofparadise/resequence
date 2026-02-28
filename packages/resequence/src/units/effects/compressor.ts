import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import type { SetupResult } from "../unit";
import { Unit } from "../unit";

export class CompressorEffectUnit extends Unit {
	readonly type = "compressor" as const;

	private readonly threshold: number;
	private readonly knee: number | undefined;
	private readonly ratio: number;
	private readonly attack: number | undefined;
	private readonly release: number | undefined;
	public readonly id?: string;

	compressorNode: DynamicsCompressorNode | undefined;

	constructor({ threshold, knee, ratio, attack, release, id }: { threshold: number; knee?: number; ratio: number; attack?: number; release?: number; id?: string }) {
		super();

		this.threshold = threshold;
		this.knee = knee;
		this.ratio = ratio;
		this.attack = attack;
		this.release = release;
		this.id = id;
	}

	protected _setup(context: ScheduleContext): SetupResult {
		const compressorNode = context.audioContext.createDynamicsCompressor();
		driveParam(compressorNode.threshold, this.id ? `${this.id}.threshold` : undefined, this.threshold, [-100, 0], context);
		driveParam(compressorNode.ratio, this.id ? `${this.id}.ratio` : undefined, this.ratio, [1, 20], context);

		if (this.knee !== undefined) compressorNode.knee.value = this.knee;
		if (this.attack !== undefined) compressorNode.attack.value = this.attack / 1000;
		if (this.release !== undefined) compressorNode.release.value = this.release / 1000;

		this.compressorNode = compressorNode;
		return { entries: [compressorNode], exits: [compressorNode] };
	}

	protected _teardown(_context: ScheduleContext): void {
		this.compressorNode = undefined;
	}
}

export function compressor({ threshold, knee, ratio, attack, release, id }: { threshold: number; knee?: number; ratio: number; attack?: number; release?: number; id?: string }): CompressorEffectUnit {
	return new CompressorEffectUnit({ threshold, knee, ratio, attack, release, id });
}

export function limiter({ threshold = -3, release = 100, id }: { threshold?: number; release?: number; id?: string } = {}): CompressorEffectUnit {
	return new CompressorEffectUnit({ threshold, knee: 0, ratio: 100, attack: 1, release, id });
}
