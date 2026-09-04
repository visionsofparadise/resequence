import { Unit, driveParam, live } from "@resequence/web-au-core";
import { z } from "zod";
import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";

const spatialSchema = z.object({
	x: live(z.number().min(-100).max(100).default(0).describe("X Position")),
	y: live(z.number().min(-100).max(100).default(0).describe("Y Position").optional()),
	z: live(z.number().min(-100).max(100).default(0).describe("Z Position").optional()),
	distanceModel: z.enum(["linear", "inverse", "exponential"]).default("inverse").describe("Distance Model").optional(),
	refDistance: z.number().min(0).max(1000).default(1).describe("Reference Distance").optional(),
	maxDistance: z.number().min(0).max(10000).default(10000).describe("Max Distance").optional(),
	rolloffFactor: z.number().min(0).max(10).default(1).describe("Rolloff Factor").optional(),
});

export class SpatialEffectUnit extends Unit<typeof spatialSchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "spatial";

	public pannerNode: PannerNode | undefined;

	constructor(input: z.infer<typeof spatialSchema> & UnitInput) {
		super(input, spatialSchema);
	}

	protected override _setup(context: UnitContext): SetupResult {
		const pannerNode = context.audioContext.createPanner();

		if (this.parameters.distanceModel?.value) pannerNode.distanceModel = this.parameters.distanceModel.value;

		if (this.parameters.refDistance?.value !== undefined) pannerNode.refDistance = this.parameters.refDistance.value;

		if (this.parameters.maxDistance?.value !== undefined) pannerNode.maxDistance = this.parameters.maxDistance.value;

		if (this.parameters.rolloffFactor?.value !== undefined)
			pannerNode.rolloffFactor = this.parameters.rolloffFactor.value;

		driveParam(pannerNode.positionX, this.parameters.x, undefined, context);
		driveParam(pannerNode.positionY, this.parameters.y, undefined, context);
		driveParam(pannerNode.positionZ, this.parameters.z, undefined, context);

		this.pannerNode = pannerNode;

		return { entries: [pannerNode], exits: [pannerNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.pannerNode = undefined;
	}
}

export function spatial(options: z.infer<typeof spatialSchema> & UnitInput): SpatialEffectUnit {
	return new SpatialEffectUnit(options);
}
