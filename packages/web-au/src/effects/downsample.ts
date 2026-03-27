import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";
import { Unit, driveParam } from "@resequence/web-au-core";

export interface DownsampleProperties extends UnitProperties {
	readonly rate: number;
	readonly previousProperties?: DownsampleProperties;
}

export class DownsampleEffectUnit extends Unit {
	readonly type = ["unit", "downsample"] as const;
	declare readonly properties: DownsampleProperties;

	static override is(value: unknown): value is DownsampleEffectUnit {
		return Unit.is(value) && value.type[1] === "downsample";
	}

	public downsampleNode: AudioWorkletNode | undefined;

	constructor(properties: UnitInput<DownsampleProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get rate(): number { return this.properties.rate; }

	clone(overrides?: Partial<DownsampleProperties>): DownsampleEffectUnit {
		return new DownsampleEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		await context.loadModule(new URL("../processors/downsample-processor.js", import.meta.url).href);

		const downsampleNode = new AudioWorkletNode(context.audioContext, "downsample-processor");

		downsampleNode.parameters.forEach((param, name) => {
			if (name === "targetRate") driveParam(param, this.id ? `${this.id}.rate` : undefined, this.rate, [100, 44100], context);
		});

		this.downsampleNode = downsampleNode;

		return { entries: [downsampleNode], exits: [downsampleNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.downsampleNode = undefined;
	}
}

export function downsample({ rate, id }: { rate: number; id?: string }): DownsampleEffectUnit {
	return new DownsampleEffectUnit({ rate, id });
}

export const sampleRate = downsample;
