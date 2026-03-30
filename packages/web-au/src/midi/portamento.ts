import type { NoteEvent, NoteSlide, SetupResult, UnitContext, MidiUnitInput } from "@resequence/web-au-core";
import { MidiUnit } from "@resequence/web-au-core";
import { z } from "zod";

interface LastPitch {
	readonly note: number;
	readonly bend: number;
	readonly slides?: ReadonlyArray<NoteSlide>;
}

const portamentoSchema = z.object({
	timeMs: z.number().min(0).default(100).describe("Glide time (ms)"),
});

export class PortamentoUnit extends MidiUnit<typeof portamentoSchema> {
	readonly type = ["unit", "midi", "portamento"] as const;


	static override is(value: unknown): value is PortamentoUnit {
		return MidiUnit.is(value) && value.type[2] === "portamento";
	}

	private lastPitch: LastPitch | undefined;

	constructor(input: z.infer<typeof portamentoSchema> & MidiUnitInput) {
		super(input, portamentoSchema);
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
		const glideTimeMs = Math.min(this.parameters.timeMs.value, noteDurationMs);

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
