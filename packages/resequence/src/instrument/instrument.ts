import { ResequenceError } from "../error";
import type { EffectsChain } from "./effect";
import type { Pitch } from "../utils/pitch";

export interface Envelope {
	readonly attack?: number;
	readonly decay?: number;
	readonly sustain?: number;
	readonly release?: number;
}

export interface InstrumentZone {
	readonly sample: string;
	readonly root: Pitch;
	readonly velocity?: [number, number];
}

export type KitMapping = Readonly<Record<string, string | ReadonlyArray<{ sample: string; velocity: [number, number] }>>>;

export class Instrument {
	readonly type: "instrument" | "kit";
	readonly name: string;
	readonly zones: ReadonlyArray<InstrumentZone>;
	readonly mapping?: KitMapping;
	readonly envelope?: Envelope;
	readonly effects?: EffectsChain;

	constructor(config: { type: "instrument" | "kit"; name: string; zones: ReadonlyArray<InstrumentZone>; mapping?: KitMapping; envelope?: Envelope; effects?: EffectsChain }) {
		this.type = config.type;
		this.name = config.name;
		this.zones = config.zones;
		this.mapping = config.mapping;
		this.envelope = config.envelope;
		this.effects = config.effects;
	}

	routeTo(effectsChain: EffectsChain): Instrument {
		return new Instrument({
			type: this.type,
			name: this.name,
			zones: this.zones,
			mapping: this.mapping,
			envelope: this.envelope,
			effects: effectsChain,
		});
	}
}

export function instrument(name: string, sample: string, options: { root: Pitch; envelope?: Envelope }): Instrument;
export function instrument(name: string, zones: ReadonlyArray<InstrumentZone>): Instrument;
export function instrument(name: string, sampleOrZones: string | ReadonlyArray<InstrumentZone>, options?: { root: Pitch; envelope?: Envelope }): Instrument {
	if (!name) {
		throw new ResequenceError('EMPTY_INSTRUMENT_NAME', 'instrument(): name must not be empty');
	}

	if (typeof sampleOrZones === "string") {
		if (!options) throw new ResequenceError('MISSING_INSTRUMENT_OPTIONS', "options with root pitch required for single-sample instrument");

		return new Instrument({
			type: "instrument",
			name,
			zones: [{ sample: sampleOrZones, root: options.root }],
			envelope: options.envelope,
		});
	}

	if (sampleOrZones.length === 0) {
		throw new ResequenceError('EMPTY_INSTRUMENT_ZONES', 'instrument(): zones array must not be empty');
	}

	return new Instrument({
		type: "instrument",
		name,
		zones: sampleOrZones,
	});
}

export function kit(name: string, mapping: KitMapping): Instrument {
	if (!name) {
		throw new ResequenceError('EMPTY_KIT_NAME', 'kit(): name must not be empty');
	}

	if (Object.keys(mapping).length === 0) {
		throw new ResequenceError('EMPTY_KIT_MAPPING', 'kit(): mapping must not be empty');
	}

	return new Instrument({
		type: "kit",
		name,
		zones: [],
		mapping,
	});
}
