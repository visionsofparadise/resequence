import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";
import { Unit, driveParam } from "@resequence/web-au-core";

export interface PanProperties extends UnitProperties {
	readonly position: number;
	readonly previousProperties?: PanProperties;
}

export class PanEffectUnit extends Unit {
	readonly type = ["unit", "pan"] as const;

	static override is(value: unknown): value is PanEffectUnit {
		return Unit.is(value) && value.type[1] === "pan";
	}

	declare readonly properties: PanProperties;
	public panNode: StereoPannerNode | undefined;

	constructor(properties: UnitInput<PanProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get position(): number { return this.properties.position; }

	clone(overrides?: Partial<PanProperties>): PanEffectUnit {
		return new PanEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override _setup(context: UnitContext): SetupResult {
		const panNode = context.audioContext.createStereoPanner();

		driveParam(panNode.pan, this.id ? `${this.id}.position` : undefined, this.position, [-1, 1], context);

		this.panNode = panNode;

		return { entries: [panNode], exits: [panNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.panNode = undefined;
	}
}

export function pan({ position, id }: { position: number; id?: string }): PanEffectUnit {
	return new PanEffectUnit({ position, id });
}
