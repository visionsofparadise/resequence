import type { ScheduleContext } from "../rendering/schedule-context";
import { driveParam, proxyDriver } from "../utils/driver";
import { linearGain, type GainEffectUnit } from "./effects/gain";
import { Unit, type SetupResult, type UnitInput, type UnitProperties } from "./unit";

export type WaveShape = "sine" | "square" | "sawtooth" | "triangle";

export interface LfoOptions {
	readonly shape: WaveShape;
	readonly rate: number;
	readonly depth: number;
}

export interface LfoProperties extends UnitProperties {
	readonly path: string;
	readonly shape: WaveShape;
	readonly rate: number;
	readonly depth: number;
}

export class LfoUnit extends Unit {
	readonly type = ["unit", "lfo"] as const;
	readonly properties: LfoProperties;

	static is(value: unknown): value is LfoUnit {
		return Unit.is(value) && value.type[1] === "lfo";
	}

	get path(): string {
		return this.properties.path;
	}

	get shape(): WaveShape {
		return this.properties.shape;
	}

	get rate(): number {
		return this.properties.rate;
	}

	get depth(): number {
		return this.properties.depth;
	}

	private oscillatorNode: OscillatorNode | undefined;
	private depthUnit: GainEffectUnit | undefined;

	constructor(properties: UnitInput<LfoProperties>) {
		super(properties);
		this.properties = {
			...properties,
			targets: properties.targets ?? [],
			modDeclarations: [{ paths: [properties.path] }],
		};
	}

	clone(overrides?: Partial<LfoProperties>): LfoUnit {
		return new LfoUnit({ ...this.properties, ...overrides });
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
