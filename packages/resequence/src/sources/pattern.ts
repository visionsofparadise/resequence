import type { Event, NoteEvent as PatternNoteEvent, Pattern, TempoMap } from "@resequence/patterns";
import { collectMetadata } from "@resequence/patterns";
import type { NoteEvent, SetupResult, UnitContext } from "@resequence/web-au";
import { MidiUnit } from "@resequence/web-au";
import type { MidiUnitInput, MidiUnitProperties } from "@resequence/web-au";
import { mapNoteEvent } from "../mapping";

export interface PortUnitProperties extends MidiUnitProperties {
	readonly portName: string;
	readonly previousProperties?: PortUnitProperties;
}

export class PortUnit extends MidiUnit {
	readonly type = ["unit", "midi", "source", "port"] as const;

	static override is(value: unknown): value is PortUnit {
		return MidiUnit.is(value) && value.type[2] === "source" && value.type[3] === "port";
	}

	declare readonly properties: PortUnitProperties;

	constructor(properties: MidiUnitInput<PortUnitProperties>) {
		super(properties);

		this.properties = {
			...properties,
			targets: properties.targets ?? [],
			modDeclarations: properties.modDeclarations ?? [],
			noteModDeclarations: properties.noteModDeclarations ?? [],
		};
	}

	get portName(): string {
		return this.properties.portName;
	}

	clone(overrides?: Partial<PortUnitProperties>): PortUnit {
		return new PortUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override _setup(context: UnitContext): SetupResult {
		const gainNode = context.audioContext.createGain();
		return { entries: [gainNode], exits: [gainNode] };
	}

	dispatch(noteEvent: NoteEvent, context: UnitContext): void {
		this.schedule(noteEvent, context);
	}
}

export class PatternSource {
	readonly type = ["source", "pattern"] as const;

	static is(value: unknown): value is PatternSource {
		return typeof value === "object" && value !== null && "type" in value && Array.isArray(value.type) && value.type[0] === "source" && value.type[1] === "pattern";
	}

	private readonly _pattern: Pattern;
	private readonly _ports = new Map<string, PortUnit>();
	private _tempoMap: TempoMap = [];

	constructor(arrangement: Pattern) {
		this._pattern = arrangement;
	}

	get pattern(): Pattern {
		return this._pattern;
	}

	port(name: string): PortUnit {
		let portUnit = this._ports.get(name);

		if (!portUnit) {
			portUnit = new PortUnit({ portName: name });
			this._ports.set(name, portUnit);
		}

		return portUnit;
	}

	get ports(): ReadonlyMap<string, PortUnit> {
		return this._ports;
	}

	async setup(context: UnitContext): Promise<void> {
		const setupEvents = this._pattern.setup(0);
		const metadata = collectMetadata(setupEvents);
		this._tempoMap = metadata.tempoMap;

		for (const [, portUnit] of this._ports) {
			await portUnit.setup(context);
		}
	}

	teardown(context: UnitContext): void {
		for (const [, portUnit] of this._ports) {
			portUnit.teardown(context);
		}
	}

	play(fromBeats: number, toBeats: number, context: UnitContext): void {
		const events = this._pattern.schedule(0, fromBeats, toBeats);

		for (const event of events) {
			if (!isNoteEvent(event)) continue;

			const portUnit = this._ports.get(event.port);

			if (!portUnit) continue;

			const note = mapNoteEvent(event, this._tempoMap);
			portUnit.dispatch(note, context);
		}
	}
}

export function patternSource(arrangement: Pattern): PatternSource {
	return new PatternSource(arrangement);
}

function isNoteEvent(event: Event): event is PatternNoteEvent {
	return event.type === "note";
}
