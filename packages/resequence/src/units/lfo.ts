import type { ScheduleContext } from "../rendering/schedule-context";
import { driveParam, proxyDriver } from "../utils/driver";
import { linearGain, type GainEffectUnit } from "./effects/gain";
import { Unit, type SetupResult } from "./unit";

export type WaveShape = "sine" | "square" | "sawtooth" | "triangle";

export interface LfoOptions {
	readonly shape: WaveShape;
	readonly rate: number;
	readonly depth: number;
}

export class LfoUnit extends Unit {
	private readonly shape: WaveShape;
	private readonly rate: number;
	private readonly depth: number;
	public readonly id?: string;

	private oscillatorNode: OscillatorNode | undefined;
	private depthUnit: GainEffectUnit | undefined;

	constructor({ path, shape, rate, depth, id }: { path: string; shape: WaveShape; rate: number; depth: number; id?: string }) {
		super();

		this.shape = shape;
		this.rate = rate;
		this.depth = depth;
		this.id = id;

		this.mod([path]);
	}

	protected async _setup(context: ScheduleContext): Promise<SetupResult> {
		const oscillatorNode = context.audioContext.createOscillator();
		oscillatorNode.type = this.shape;

		driveParam(oscillatorNode.frequency, this.id ? `${this.id}.rate` : undefined, this.rate, [0.01, 100], context);

		const depthId = crypto.randomUUID();
		const depthUnit = linearGain({ level: this.depth, id: depthId });
		await depthUnit.setup(context);

		if (!depthUnit.gainNode) throw new Error();

		oscillatorNode.connect(depthUnit.gainNode);
		oscillatorNode.start();

		proxyDriver(this.id, "depth", `${depthId}.level`, context);

		this.oscillatorNode = oscillatorNode;
		this.depthUnit = depthUnit;

		return { exits: [depthUnit] };
	}

	protected _teardown(context: ScheduleContext): void {
		this.oscillatorNode?.stop();
		this.oscillatorNode?.disconnect();
		this.oscillatorNode = undefined;
		this.depthUnit?.gainNode?.disconnect();
		this.depthUnit?.teardown(context);
		this.depthUnit = undefined;
	}
}

export function lfo({ path, shape, rate, depth, id }: { path: string; shape: WaveShape; rate: number; depth: number; id?: string }): LfoUnit {
	return new LfoUnit({ path, shape, rate, depth, id });
}
