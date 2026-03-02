import type { ScheduleContext } from "../../rendering/schedule-context";
import type { SetupResult } from "../unit";
import { Unit } from "../unit";

export class ConvolutionEffectUnit extends Unit {
	readonly type = ["unit", "convolution"] as const;

	static is(value: unknown): value is ConvolutionEffectUnit {
		return Unit.is(value) && value.type[1] === "convolution";
	}

	private readonly impulse: string;
	private readonly normalize: boolean | undefined;
	convolverNode: ConvolverNode | undefined;

	constructor({ impulse, normalize }: { impulse: string; normalize?: boolean }) {
		super();

		this.impulse = impulse;
		this.normalize = normalize;
	}

	protected async _setup(context: ScheduleContext): Promise<SetupResult> {
		const convolverNode = context.audioContext.createConvolver();

		if (this.normalize !== undefined) convolverNode.normalize = this.normalize;

		try {
			convolverNode.buffer = await context.getSample(this.impulse);
		} catch {
			// impulse not loadable — skip
		}

		this.convolverNode = convolverNode;
		return { entries: [convolverNode], exits: [convolverNode] };
	}

	protected _teardown(_context: ScheduleContext): void {
		this.convolverNode = undefined;
	}
}

export function convolution({ impulse, normalize }: { impulse: string; normalize?: boolean }): ConvolutionEffectUnit {
	return new ConvolutionEffectUnit({ impulse, normalize });
}
