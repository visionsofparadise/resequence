import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";
import { z } from "zod";

export class SpeakersUnit extends Unit {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "speakers";

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
