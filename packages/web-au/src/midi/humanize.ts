import type { MidiUnitProperties, NoteEvent, SetupResult, UnitContext } from "@resequence/web-au-core";

import { MidiUnit, type MidiUnitInput } from "@resequence/web-au-core";

export interface HumanizeProperties extends MidiUnitProperties {
	readonly timing?: number;
	readonly velocity?: number;
}

export class HumanizeMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "humanize"] as const;
	declare readonly properties: HumanizeProperties;

	static override is(value: unknown): value is HumanizeMidiUnit {
		return MidiUnit.is(value) && value.type[2] === "humanize";
	}

	get timing(): number {
		return this.properties.timing ?? 0;
	}

	get velocity(): number {
		return this.properties.velocity ?? 0;
	}

	private seed = 0;

	constructor(properties: MidiUnitInput<HumanizeProperties>) {
		super(properties);
		this.properties = {
			...properties,
			targets: properties.targets ?? [],
			modDeclarations: properties.modDeclarations ?? [],
			noteModDeclarations: properties.noteModDeclarations ?? [],
		};
	}

	override schedule(noteEvent: NoteEvent, context: UnitContext): void {
		const timingOffset = this.timing > 0 ? this.nextRandom() * this.timing * 2 - this.timing : 0;
		const velocityOffset = this.velocity > 0 ? this.nextRandom() * this.velocity * 2 - this.velocity : 0;

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
	return new HumanizeMidiUnit(options);
}
