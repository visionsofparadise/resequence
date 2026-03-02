import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import type { SetupResult } from "../unit";
import { Unit } from "../unit";

export class BitcrushEffectUnit extends Unit {
	readonly type = ["unit", "bitcrush"] as const;

	static is(value: unknown): value is BitcrushEffectUnit {
		return Unit.is(value) && value.type[1] === "bitcrush";
	}

	public bitcrushNode: AudioWorkletNode | undefined;

	constructor(
		private readonly bits: number,
		public readonly id?: string,
	) {
		super();
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
	return new BitcrushEffectUnit(bits, id);
}
