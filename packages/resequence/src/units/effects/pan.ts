import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import { Unit } from "../unit";

export class PanEffectUnit extends Unit {
	readonly type = "pan" as const;
	protected readonly innerUnits: ReadonlyArray<Unit> = [];

	public panNode: StereoPannerNode | undefined;

	constructor(
		private readonly position: number,
		public readonly id?: string,
	) {
		super();
	}

	protected _setup(context: ScheduleContext): void {
		const panNode = context.audioContext.createStereoPanner();
		driveParam(panNode.pan, this.id, "position", this.position, context, [-1, 1]);

		this.panNode = panNode;
		this.entryNodes.push(panNode);
		this.exitNodes.push(panNode);
	}

	protected _teardown(_context: ScheduleContext): void {
		this.panNode = undefined;
	}
}

export function pan({ position, id }: { position: number; id?: string }): PanEffectUnit {
	return new PanEffectUnit(position, id);
}
