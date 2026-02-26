import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import { Unit } from "../unit";

export class BitcrushEffectUnit extends Unit {
	readonly type = "bitcrush" as const;
	protected readonly innerUnits: ReadonlyArray<Unit> = [];

	public bitcrushNode: AudioWorkletNode | undefined;

	constructor(
		private readonly bits: number,
		public readonly id?: string,
	) {
		super();
	}

	collectModuleUrls(): Set<string> {
		const urls = super.collectModuleUrls();
		urls.add(new URL("./bitcrush-processor.js", import.meta.url).href);
		return urls;
	}

	protected _setup(context: ScheduleContext): void {
		const bitcrushNode = new AudioWorkletNode(context.audioContext, "bitcrush-processor");

		bitcrushNode.parameters.forEach((param, name) => {
			if (name === "bits") driveParam(param, this.id, "bits", this.bits, context, [1, 16]);
		});

		this.bitcrushNode = bitcrushNode;
		this.entryNodes.push(bitcrushNode);
		this.exitNodes.push(bitcrushNode);
	}

	protected _teardown(_context: ScheduleContext): void {
		this.bitcrushNode = undefined;
	}
}

export function bitcrush({ bits, id }: { bits: number; id?: string }): BitcrushEffectUnit {
	return new BitcrushEffectUnit(bits, id);
}
