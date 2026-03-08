import type { UnitContext } from "../context";
import type { SetupResult, UnitInput, UnitProperties } from "../unit";
import { Unit } from "../unit";

export interface SpeakersProperties extends UnitProperties {
	readonly previousProperties?: SpeakersProperties;
}

export class SpeakersUnit extends Unit {
	readonly type = ["unit", "target", "speakers"] as const;

	static override is(value: unknown): value is SpeakersUnit {
		return Unit.is(value) && value.type[1] === "target" && value.type[2] === "speakers";
	}

	declare readonly properties: SpeakersProperties;

	constructor(properties?: UnitInput<SpeakersProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties?.targets ?? [], modDeclarations: properties?.modDeclarations ?? [] };
	}

	clone(overrides?: Partial<SpeakersProperties>): SpeakersUnit {
		return new SpeakersUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override _setup(context: UnitContext): SetupResult {
		const gainNode = context.audioContext.createGain();

		if (!("startRendering" in context.audioContext)) {
			gainNode.connect(context.audioContext.destination);
		}

		return { entries: [gainNode], exits: [gainNode] };
	}
}

export function speakers(): SpeakersUnit {
	return new SpeakersUnit();
}
