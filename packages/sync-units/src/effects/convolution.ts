import type { UnitContext } from "../context";
import type { SetupResult, UnitInput, UnitProperties } from "../unit";
import { Unit } from "../unit";

export interface ConvolutionProperties extends UnitProperties {
	readonly impulse: string;
	readonly normalize?: boolean;
	readonly previousProperties?: ConvolutionProperties;
}

export class ConvolutionEffectUnit extends Unit {
	readonly type = ["unit", "convolution"] as const;
	declare readonly properties: ConvolutionProperties;

	static override is(value: unknown): value is ConvolutionEffectUnit {
		return Unit.is(value) && value.type[1] === "convolution";
	}

	public convolverNode: ConvolverNode | undefined;

	constructor(properties: UnitInput<ConvolutionProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get impulse(): string { return this.properties.impulse; }
	get normalize(): boolean | undefined { return this.properties.normalize; }

	clone(overrides?: Partial<ConvolutionProperties>): ConvolutionEffectUnit {
		return new ConvolutionEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
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

	protected override _teardown(_context: UnitContext): void {
		this.convolverNode = undefined;
	}
}

export function convolution({ impulse, normalize }: { impulse: string; normalize?: boolean }): ConvolutionEffectUnit {
	return new ConvolutionEffectUnit({ impulse, normalize });
}
