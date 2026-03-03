import type { ScheduleContext } from "../../rendering/schedule-context";
import type { SetupResult, UnitInput, UnitProperties } from "../unit";
import { Unit } from "../unit";

export interface ConvolutionProperties extends UnitProperties {
	readonly impulse: string;
	readonly normalize?: boolean;
}

export class ConvolutionEffectUnit extends Unit {
	readonly type = ["unit", "convolution"] as const;
	readonly properties: ConvolutionProperties;

	static is(value: unknown): value is ConvolutionEffectUnit {
		return Unit.is(value) && value.type[1] === "convolution";
	}

	convolverNode: ConvolverNode | undefined;

	constructor(properties: UnitInput<ConvolutionProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get impulse(): string { return this.properties.impulse; }
	get normalize(): boolean | undefined { return this.properties.normalize; }

	clone(overrides?: Partial<ConvolutionProperties>): ConvolutionEffectUnit {
		return new ConvolutionEffectUnit({ ...this.properties, ...overrides });
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
