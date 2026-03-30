import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";
import { z } from "zod";

export class SpeakersUnit extends Unit {
	readonly type = ["unit", "target", "speakers"] as const;

	static override is(value: unknown): value is SpeakersUnit {
		return Unit.is(value) && value.type[1] === "target" && value.type[2] === "speakers";
	}

	constructor(input?: UnitInput) {
		super(input ?? {}, z.object({}));
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
