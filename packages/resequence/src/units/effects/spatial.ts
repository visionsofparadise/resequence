import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import { Unit } from "../unit";

export interface SpatialOptions {
	readonly x: number;
	readonly y?: number;
	readonly z?: number;
	readonly distanceModel?: DistanceModelType;
	readonly refDistance?: number;
	readonly maxDistance?: number;
	readonly rolloffFactor?: number;
	readonly id?: string;
}

export class SpatialEffectUnit extends Unit {
	readonly type = "spatial" as const;
	protected readonly innerUnits: ReadonlyArray<Unit> = [];

	private readonly x: number;
	private readonly y: number;
	private readonly z: number;
	private readonly distanceModel: DistanceModelType | undefined;
	private readonly refDistance: number | undefined;
	private readonly maxDistance: number | undefined;
	private readonly rolloffFactor: number | undefined;
	public readonly id?: string;

	public pannerNode: PannerNode | undefined;

	constructor({ x, y, z, distanceModel, refDistance, maxDistance, rolloffFactor, id }: SpatialOptions) {
		super();
		this.x = x;
		this.y = y ?? 0;
		this.z = z ?? 0;
		this.distanceModel = distanceModel;
		this.refDistance = refDistance;
		this.maxDistance = maxDistance;
		this.rolloffFactor = rolloffFactor;
		this.id = id;
	}

	protected _setup(context: ScheduleContext): void {
		const pannerNode = context.audioContext.createPanner();

		if (this.distanceModel) pannerNode.distanceModel = this.distanceModel;
		if (this.refDistance !== undefined) pannerNode.refDistance = this.refDistance;
		if (this.maxDistance !== undefined) pannerNode.maxDistance = this.maxDistance;
		if (this.rolloffFactor !== undefined) pannerNode.rolloffFactor = this.rolloffFactor;

		driveParam(pannerNode.positionX, this.id, "x", this.x, context, [-100, 100]);
		driveParam(pannerNode.positionY, this.id, "y", this.y, context, [-100, 100]);
		driveParam(pannerNode.positionZ, this.id, "z", this.z, context, [-100, 100]);

		this.pannerNode = pannerNode;
		this.entryNodes.push(pannerNode);
		this.exitNodes.push(pannerNode);
	}

	protected _teardown(_context: ScheduleContext): void {
		this.pannerNode = undefined;
	}
}

export function spatial(options: SpatialOptions): SpatialEffectUnit {
	return new SpatialEffectUnit(options);
}
