import type { NoteEvent, SetupResult, UnitContext, MidiUnitInput } from "@resequence/web-au-core";
import { MidiUnit } from "@resequence/web-au-core";
import { z } from "zod";

const humanizeSchema = z.object({
	timing: z.number().min(0).default(0).describe("Timing jitter (ms)"),
	velocity: z.number().min(0).default(0).describe("Velocity jitter"),
});

export class HumanizeMidiUnit extends MidiUnit<typeof humanizeSchema> {
	readonly type = ["unit", "midi"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "humanize";

	private seed = 0;

	constructor(input: z.infer<typeof humanizeSchema> & MidiUnitInput) {
		super(input, humanizeSchema);
	}

	override schedule(noteEvent: NoteEvent, context: UnitContext): void {
		const timingOffset = this.parameters.timing.value > 0 ? this.nextRandom() * this.parameters.timing.value * 2 - this.parameters.timing.value : 0;
		const velocityOffset = this.parameters.velocity.value > 0 ? this.nextRandom() * this.parameters.velocity.value * 2 - this.parameters.velocity.value : 0;

		const startMs = Math.max(0, noteEvent.startMs + timingOffset);
		const stopMs = Math.max(startMs, noteEvent.stopMs + timingOffset);
		const cleanupMs = Math.max(stopMs, noteEvent.cleanupMs + timingOffset);
		const newVelocity = Math.max(1, Math.min(127, Math.round(noteEvent.velocity + velocityOffset)));

		const jittered: NoteEvent = {
			...noteEvent,
			startMs,
			stopMs,
			cleanupMs,
			velocity: newVelocity,
		};

		super.schedule(jittered, context);
	}

	protected override _setup(_context: UnitContext): SetupResult {
		this.seed = 0;

		return {};
	}

	private nextRandom(): number {
		this.seed = (this.seed * 1664525 + 1013904223) >>> 0;

		return this.seed / 0x100000000;
	}
}

export function humanize(options: { timing?: number; velocity?: number }): HumanizeMidiUnit {
	return new HumanizeMidiUnit({ timing: options.timing ?? 0, velocity: options.velocity ?? 0 });
}
