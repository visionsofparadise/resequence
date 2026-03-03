import type { ScheduleContext } from "../../rendering/schedule-context";
import type { MidiUnitProperties, VoiceNote } from "../midi-unit";
import { MidiUnit, type MidiUnitInput } from "../midi-unit";
import type { SetupResult } from "../unit";

export interface HumanizeMidiOptions {
	readonly timing?: number;
	readonly velocity?: number;
}

export interface HumanizeProperties extends MidiUnitProperties {
	readonly timing?: number;
	readonly velocity?: number;
}

export class HumanizeMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "humanize"] as const;
	readonly properties: HumanizeProperties;

	static is(value: unknown): value is HumanizeMidiUnit {
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

	clone(overrides?: Partial<HumanizeProperties>): HumanizeMidiUnit {
		return new HumanizeMidiUnit({ ...this.properties, ...overrides });
	}

	override schedule(voiceNote: VoiceNote, scheduleContext: ScheduleContext): void {
		const timingOffset = this.timing > 0 ? this.nextRandom() * this.timing * 2 - this.timing : 0;
		const velocityOffset = this.velocity > 0 ? this.nextRandom() * this.velocity * 2 - this.velocity : 0;

		const startMs = Math.max(0, voiceNote.startMs + timingOffset);
		const stopMs = Math.max(startMs, voiceNote.stopMs + timingOffset);
		const cleanupMs = Math.max(stopMs, voiceNote.cleanupMs + timingOffset);
		const newVelocity = Math.max(1, Math.min(127, Math.round(voiceNote.velocity + velocityOffset)));

		const jittered: VoiceNote = {
			...voiceNote,
			startMs,
			stopMs,
			cleanupMs,
			velocity: newVelocity,
		};

		super.schedule(jittered, scheduleContext);
	}

	protected _setup(_context: ScheduleContext): SetupResult {
		this.seed = 0;

		return {};
	}

	private nextRandom(): number {
		this.seed = (this.seed * 1664525 + 1013904223) >>> 0;

		return this.seed / 0x100000000;
	}
}

export function humanize(options: HumanizeMidiOptions): HumanizeMidiUnit {
	return new HumanizeMidiUnit(options);
}
