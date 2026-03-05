import type { UnitContext } from "../context";
import type { MidiUnitProperties } from "../midi-unit";
import { MidiUnit, type MidiUnitInput } from "../midi-unit";
import type { NoteEvent, NoteSlide } from "../note-event";
import type { SetupResult } from "../unit";

interface LastPitch {
	readonly note: number;
	readonly bend: number;
	readonly slides?: ReadonlyArray<NoteSlide>;
}

export interface PortamentoProperties extends MidiUnitProperties {
	readonly timeMs: number;
	readonly previousProperties?: PortamentoProperties;
}

export class PortamentoUnit extends MidiUnit {
	readonly type = ["unit", "midi", "portamento"] as const;
	declare readonly properties: PortamentoProperties;

	static override is(value: unknown): value is PortamentoUnit {
		return MidiUnit.is(value) && value.type[2] === "portamento";
	}

	private lastPitch: LastPitch | undefined;

	get timeMs(): number {
		return this.properties.timeMs;
	}

	constructor(properties: MidiUnitInput<PortamentoProperties>) {
		super(properties);
		this.properties = {
			...properties,
			targets: properties.targets ?? [],
			modDeclarations: properties.modDeclarations ?? [],
			noteModDeclarations: properties.noteModDeclarations ?? [],
		};
	}

	clone(overrides?: Partial<PortamentoProperties>): PortamentoUnit {
		return new PortamentoUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	override schedule(noteEvent: NoteEvent, context: UnitContext): void {
		const modified = this.applyPortamento(noteEvent);

		for (const target of this.targets) {
			if (target instanceof MidiUnit) target.schedule(modified, context);
		}

		this.lastPitch = {
			note: noteEvent.note,
			bend: noteEvent.bend,
			slides: modified.slides,
		};
	}

	protected override _setup(_context: UnitContext): SetupResult {
		this.lastPitch = undefined;
		return {};
	}

	private applyPortamento(noteEvent: NoteEvent): NoteEvent {
		if (!this.lastPitch) return noteEvent;

		let prevAbsolute = this.lastPitch.note + this.lastPitch.bend / 100;

		if (this.lastPitch.slides && this.lastPitch.slides.length > 0) {
			const lastSlide = this.lastPitch.slides[this.lastPitch.slides.length - 1];
			if (lastSlide) prevAbsolute += lastSlide.cents / 100;
		}

		const currentAbsolute = noteEvent.note + noteEvent.bend / 100;

		const glideStartCents = (prevAbsolute - currentAbsolute) * 100;

		if (Math.abs(glideStartCents) < 0.01) return noteEvent;

		const noteDurationMs = noteEvent.stopMs - noteEvent.startMs;
		const glideTimeMs = Math.min(this.timeMs, noteDurationMs);

		const portaSlides: Array<NoteSlide> = [
			{ timeMs: 0, cents: glideStartCents, curve: 0 },
			{ timeMs: glideTimeMs, cents: 0, curve: 0 },
		];

		if (!noteEvent.slides || noteEvent.slides.length === 0) {
			return { ...noteEvent, slides: portaSlides };
		}

		const merged: Array<NoteSlide> = [...portaSlides];

		for (const existing of noteEvent.slides) {
			if (existing.timeMs > glideTimeMs) {
				merged.push(existing);
			}
		}

		return { ...noteEvent, slides: merged };
	}
}

export function portamento(options: { timeMs: number }): PortamentoUnit {
	return new PortamentoUnit({ timeMs: options.timeMs });
}

export const porta = portamento;
