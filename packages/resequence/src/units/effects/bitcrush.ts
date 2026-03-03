import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import type { SetupResult, UnitInput, UnitProperties } from "../unit";
import { Unit } from "../unit";

export interface BitcrushProperties extends UnitProperties {
	readonly bits: number;
}

export class BitcrushEffectUnit extends Unit {
	readonly type = ["unit", "bitcrush"] as const;
	readonly properties: BitcrushProperties;

	static is(value: unknown): value is BitcrushEffectUnit {
		return Unit.is(value) && value.type[1] === "bitcrush";
	}

	public bitcrushNode: AudioWorkletNode | undefined;

	constructor(properties: UnitInput<BitcrushProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get bits(): number { return this.properties.bits; }

	clone(overrides?: Partial<BitcrushProperties>): BitcrushEffectUnit {
		return new BitcrushEffectUnit({ ...this.properties, ...overrides });
	}

	protected async _setup(context: ScheduleContext): Promise<SetupResult> {
		await context.loadModule(new URL("./bitcrush-processor.js", import.meta.url).href);

		const bitcrushNode = new AudioWorkletNode(context.audioContext, "bitcrush-processor");

		bitcrushNode.parameters.forEach((param, name) => {
			if (name === "bits") driveParam(param, this.id ? `${this.id}.bits` : undefined, this.bits, [1, 16], context);
		});

		this.bitcrushNode = bitcrushNode;
		return { entries: [bitcrushNode], exits: [bitcrushNode] };
	}

	protected _teardown(_context: ScheduleContext): void {
		this.bitcrushNode = undefined;
	}
}

export function bitcrush({ bits, id }: { bits: number; id?: string }): BitcrushEffectUnit {
	return new BitcrushEffectUnit({ bits, id });
}
