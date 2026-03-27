import type { UnitContext } from "./context";
import type { NoteEvent } from "./note-event";
import type { ModDeclaration, UnitProperties } from "./unit";
import { Unit } from "./unit";

export type NoteProperty = "velocity" | "pitch" | "gate";

export interface NoteModDeclaration {
	readonly property: NoteProperty;
	readonly paths: ReadonlyArray<string>;
	readonly transform?: (value: number) => number;
}

export interface MidiUnitProperties extends UnitProperties {
	readonly noteModDeclarations: Array<NoteModDeclaration>;
}

type OptionalMidiKeys = "targets" | "modDeclarations" | "noteModDeclarations";

export type MidiUnitInput<P extends MidiUnitProperties = MidiUnitProperties> = Omit<P, OptionalMidiKeys> & Partial<Pick<P, OptionalMidiKeys>>;

export abstract class MidiUnit extends Unit {
	abstract readonly type: readonly ["unit", "midi", ...Array<string>];
	declare properties: MidiUnitProperties;

	static override is(value: unknown): value is MidiUnit {
		return Unit.is(value) && value.type[1] === "midi";
	}

	constructor(properties?: MidiUnitInput) {
		super(properties);

		this.properties = {
			...properties,
			targets: properties?.targets ?? [],
			modDeclarations: properties?.modDeclarations ?? ([] as Array<ModDeclaration>),
			noteModDeclarations: properties?.noteModDeclarations ?? [],
		};
	}

	noteMod(property: NoteProperty, paths: Array<string>, transform?: (value: number) => number): void {
		this.properties = { ...this.properties, noteModDeclarations: [...this.properties.noteModDeclarations, { property, paths, transform }] };
	}

	schedule(noteEvent: NoteEvent, context: UnitContext): void {
		this._schedule(noteEvent, context);

		this.applyNoteMods(noteEvent, context);

		for (const target of this.targets) {
			if (target instanceof MidiUnit) target.schedule(noteEvent, context);
		}
	}

	protected _schedule(_noteEvent: NoteEvent, _context: UnitContext): void {
		return;
	}

	private applyNoteMods(noteEvent: NoteEvent, context: UnitContext): void {
		for (const decl of this.properties.noteModDeclarations) {
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
