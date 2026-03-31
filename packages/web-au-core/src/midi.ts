import type { z } from "zod";
import type { UnitContext } from "./context";
import type { NoteEvent } from "./note-event";
import { type UnitInput, Unit } from "./unit";

export type NoteProperty = "velocity" | "pitch" | "gate";

export interface NoteModDeclaration {
	readonly property: NoteProperty;
	readonly paths: ReadonlyArray<string>;
	readonly transform?: (value: number) => number;
}

export interface MidiUnitInput extends UnitInput {}

export abstract class MidiUnit<
	S extends z.ZodObject = z.ZodObject,
> extends Unit<S> {
	readonly type = ["unit", "midi"];
	readonly noteModDeclarations: Array<NoteModDeclaration> = [];

	static override is(value: unknown): value is MidiUnit {
		return Unit.is(value) && value.type[1] === "midi";
	}

	noteMod(property: NoteProperty, paths: Array<string>, transform?: (value: number) => number): void {
		this.noteModDeclarations.push({ property, paths, transform });
	}

	schedule(noteEvent: NoteEvent, context: UnitContext): void {
		this._schedule(noteEvent, context);

		this.applyNoteMods(noteEvent, context);

		for (const target of this.targets) {
			if (MidiUnit.is(target)) target.schedule(noteEvent, context);
		}
	}

	protected _schedule(_noteEvent: NoteEvent, _context: UnitContext): void {
		return;
	}

	private applyNoteMods(noteEvent: NoteEvent, context: UnitContext): void {
		for (const decl of this.noteModDeclarations) {
			let value: number;

			switch (decl.property) {
				case "velocity":
					value = noteEvent.velocity / 127;
					break;
				case "pitch":
					value = noteEvent.note / 127;
					break;
				case "gate":
					value = 1;
					break;
			}

			if (decl.transform) {
				value = decl.transform(value);
			}

			const startSeconds = noteEvent.startMs / 1000;

			for (const path of decl.paths) {
				const entry = context.driverMap.get(path);

				if (!entry) continue;

				entry.node.offset.setValueAtTime(value, startSeconds);

				if (decl.property === "gate") {
					const stopSeconds = noteEvent.stopMs / 1000;

					entry.node.offset.setValueAtTime(0, stopSeconds);
				}
			}
		}
	}
}
