import type { ScheduleContext } from "../rendering/schedule-context";
import type { OptionalProperties } from "../utils/RequiredProperties";
import type { Pitch } from "../utils/pitch";
import type { UnitProperties } from "./unit";
import { Unit } from "./unit";

export type NoteProperty = "velocity" | "pitch" | "gate";

export interface VoiceSlide {
	readonly timeMs: number;
	readonly cents: number;
	readonly curve: number;
}

export interface VoiceNote {
	readonly note: number;
	readonly bend: number;
	readonly velocity: number;
	readonly startMs: number;
	readonly stopMs: number;
	readonly cleanupMs: number;
	readonly lyric?: string;
	readonly pitch?: Pitch;
	readonly slides?: ReadonlyArray<VoiceSlide>;
	readonly attack?: number;
	readonly release?: number;
	readonly sustain?: number;
	readonly cutoff?: number;
	readonly resonance?: number;
	readonly volume?: number;
	readonly expression?: number;
	readonly pan?: number;
	readonly chorus?: number;
	readonly reverb?: number;
	readonly cc?: Partial<Record<number, number>>;
}

export interface NoteModDeclaration {
	readonly property: NoteProperty;
	readonly paths: ReadonlyArray<string>;
	readonly transform?: (value: number) => number;
}

export interface MidiUnitProperties extends UnitProperties {
	readonly noteModDeclarations: Array<NoteModDeclaration>;
}

export type MidiUnitInput<P extends MidiUnitProperties = MidiUnitProperties> = OptionalProperties<
	P,
	"targets" | "modDeclarations" | "noteModDeclarations"
>;

export abstract class MidiUnit extends Unit {
	abstract readonly type: readonly ["unit", "midi", ...Array<string>];
	readonly properties: MidiUnitProperties;

	static is(value: unknown): value is MidiUnit {
		return Unit.is(value) && value.type[1] === "midi";
	}

	constructor(properties?: MidiUnitInput) {
		super(properties);
		this.properties = {
			...properties,
			targets: properties?.targets ?? [],
			modDeclarations: properties?.modDeclarations ?? [],
			noteModDeclarations: properties?.noteModDeclarations ?? [],
		};
	}

	noteMod(property: NoteProperty, paths: Array<string>, transform?: (value: number) => number): void {
		this.properties.noteModDeclarations.push({ property, paths, transform });
	}

	schedule(voiceNote: VoiceNote, scheduleContext: ScheduleContext): void {
		this._schedule(voiceNote, scheduleContext);

		this.applyNoteMods(voiceNote, scheduleContext);

		for (const target of this.targets) {
			if (target instanceof MidiUnit) target.schedule(voiceNote, scheduleContext);
		}
	}

	protected _schedule(_voiceNote: VoiceNote, _scheduleContext: ScheduleContext): void {
		return;
	}

	private applyNoteMods(voiceNote: VoiceNote, context: ScheduleContext): void {
		for (const decl of this.properties.noteModDeclarations) {
			let value: number;

			switch (decl.property) {
				case "velocity":
					value = voiceNote.velocity / 127;
					break;
				case "pitch":
					value = voiceNote.note / 127;
					break;
				case "gate":
					value = 1;
					break;
			}

			if (decl.transform) {
				value = decl.transform(value);
			}

			const startSeconds = voiceNote.startMs / 1000;

			for (const path of decl.paths) {
				const entry = context.driverMap.get(path);
				if (!entry) continue;

				entry.node.offset.setValueAtTime(value, startSeconds);

				if (decl.property === "gate") {
					const stopSeconds = voiceNote.stopMs / 1000;
					entry.node.offset.setValueAtTime(0, stopSeconds);
				}
			}
		}
	}
}
