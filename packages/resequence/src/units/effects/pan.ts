import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import type { SetupResult, UnitInput, UnitProperties } from "../unit";
import { Unit } from "../unit";

export interface PanProperties extends UnitProperties {
	readonly position: number;
}

export class PanEffectUnit extends Unit {
	readonly type = ["unit", "pan"] as const;

	static is(value: unknown): value is PanEffectUnit {
		return Unit.is(value) && value.type[1] === "pan";
	}

	readonly properties: PanProperties;
	public panNode: StereoPannerNode | undefined;

	constructor(properties: UnitInput<PanProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get position(): number { return this.properties.position; }

	clone(overrides?: Partial<PanProperties>): PanEffectUnit {
		return new PanEffectUnit({ ...this.properties, ...overrides });
	}

	protected _setup(context: ScheduleContext): SetupResult {
		const panNode = context.audioContext.createStereoPanner();
		driveParam(panNode.pan, this.id ? `${this.id}.position` : undefined, this.position, [-1, 1], context);

		this.panNode = panNode;
		return { entries: [panNode], exits: [panNode] };
	}

	protected _teardown(_context: ScheduleContext): void {
		this.panNode = undefined;
	}
}

export function pan({ position, id }: { position: number; id?: string }): PanEffectUnit {
	return new PanEffectUnit({ position, id });
}
