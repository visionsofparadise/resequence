import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { driveParam, proxyDriver, Unit, live } from "@resequence/web-au-core";
import { z } from "zod";
import { linearGain, type GainEffectUnit } from "./effects/gain";

export type WaveShape = "sine" | "square" | "sawtooth" | "triangle";

const lfoSchema = z.object({
	path: z.string().describe("Target path"),
	shape: z.enum(["sine", "square", "sawtooth", "triangle"]).default("sine").describe("Shape"),
	rate: live(z.number().min(0.01).max(100).default(1).describe("Rate (Hz)")),
	depth: live(z.number().min(0).max(1).default(0.5).describe("Depth")),
});

export class LfoUnit extends Unit<typeof lfoSchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "lfo";

	private oscillatorNode: OscillatorNode | undefined;
	private depthUnit: GainEffectUnit | undefined;

	constructor(input: z.infer<typeof lfoSchema> & UnitInput) {
		super(input, lfoSchema);
		this.modDeclarations.push({ paths: [this.parameters.path.value] });
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const oscillatorNode = context.audioContext.createOscillator();

		oscillatorNode.type = this.parameters.shape.value;

		driveParam(oscillatorNode.frequency, this.parameters.rate, undefined, context);

		const depthId = crypto.randomUUID();
		const depthUnit = linearGain({ level: this.parameters.depth.value, id: depthId });

		await depthUnit.setup(context);

		if (!depthUnit.gainNode) throw new Error();

		oscillatorNode.connect(depthUnit.gainNode);
		oscillatorNode.start();

		proxyDriver(this.parameters.depth, depthUnit.parameters.level, context);

		this.oscillatorNode = oscillatorNode;
		this.depthUnit = depthUnit;

		return { exits: [depthUnit] };
	}

	protected override _teardown(context: UnitContext): void {
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
