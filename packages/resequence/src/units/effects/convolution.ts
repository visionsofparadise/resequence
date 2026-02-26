import type { ScheduleContext } from "../../rendering/schedule-context";
import { Unit } from "../unit";

export class ConvolutionEffectUnit extends Unit {
	readonly id = undefined;
	protected readonly innerUnits: ReadonlyArray<Unit> = [];

	private readonly impulse: string;
	private readonly normalize: boolean | undefined;
	convolverNode: ConvolverNode | undefined;

	constructor({ impulse, normalize }: { impulse: string; normalize?: boolean }) {
		super();

		this.impulse = impulse;
		this.normalize = normalize;
		this.sampleKeys.add(impulse);
	}

	protected _setup(context: ScheduleContext): void {
		const convolverNode = context.audioContext.createConvolver();

		if (this.normalize !== undefined) convolverNode.normalize = this.normalize;

		const impulseBuffer = context.sampleMap.get(this.impulse);
		if (impulseBuffer) convolverNode.buffer = impulseBuffer;

		this.convolverNode = convolverNode;
		this.entryNodes.push(convolverNode);
		this.exitNodes.push(convolverNode);
	}

	protected _teardown(_context: ScheduleContext): void {
		this.convolverNode = undefined;
	}
}

export function convolution({ impulse, normalize }: { impulse: string; normalize?: boolean }): ConvolutionEffectUnit {
	return new ConvolutionEffectUnit({ impulse, normalize });
}
