import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";
import { Unit, driveParam } from "@resequence/web-au-core";

export interface SpatialProperties extends UnitProperties {
	readonly x: number;
	readonly y?: number;
	readonly z?: number;
	readonly distanceModel?: DistanceModelType;
	readonly refDistance?: number;
	readonly maxDistance?: number;
	readonly rolloffFactor?: number;
	readonly previousProperties?: SpatialProperties;
}

export class SpatialEffectUnit extends Unit {
	readonly type = ["unit", "spatial"] as const;
	declare readonly properties: SpatialProperties;

	static override is(value: unknown): value is SpatialEffectUnit {
		return Unit.is(value) && value.type[1] === "spatial";
	}

	public pannerNode: PannerNode | undefined;

	constructor(properties: UnitInput<SpatialProperties>) {
		super(properties);
		this.properties = {
			...properties,
			targets: properties.targets ?? [],
			modDeclarations: properties.modDeclarations ?? [],
		};
	}

	get x(): number { return this.properties.x; }
	get y(): number { return this.properties.y ?? 0; }
	get z(): number { return this.properties.z ?? 0; }
	get distanceModel(): DistanceModelType | undefined { return this.properties.distanceModel; }
	get refDistance(): number | undefined { return this.properties.refDistance; }
	get maxDistance(): number | undefined { return this.properties.maxDistance; }
	get rolloffFactor(): number | undefined { return this.properties.rolloffFactor; }

	clone(overrides?: Partial<SpatialProperties>): SpatialEffectUnit {
		return new SpatialEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override _setup(context: UnitContext): SetupResult {
		const pannerNode = context.audioContext.createPanner();

		if (this.distanceModel) pannerNode.distanceModel = this.distanceModel;
		if (this.refDistance !== undefined) pannerNode.refDistance = this.refDistance;
		if (this.maxDistance !== undefined) pannerNode.maxDistance = this.maxDistance;
		if (this.rolloffFactor !== undefined) pannerNode.rolloffFactor = this.rolloffFactor;

		driveParam(pannerNode.positionX, this.id ? `${this.id}.x` : undefined, this.x, [-100, 100], context);
		driveParam(pannerNode.positionY, this.id ? `${this.id}.y` : undefined, this.y, [-100, 100], context);
		driveParam(pannerNode.positionZ, this.id ? `${this.id}.z` : undefined, this.z, [-100, 100], context);

		this.pannerNode = pannerNode;

		return { entries: [pannerNode], exits: [pannerNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.pannerNode = undefined;
	}
}

export function spatial(options: UnitInput<SpatialProperties>): SpatialEffectUnit {
	return new SpatialEffectUnit(options);
}
