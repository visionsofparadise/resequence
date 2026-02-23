import { ResequenceError } from "../error";
import type { EffectsChain } from "./effect";
import type { EnvelopesChain } from "./envelope";
import { isEnvelopesChain } from "./envelope";
import type { Pitch } from "../utils/pitch";

export interface InstrumentZone {
	readonly sample: string;
	readonly root: Pitch;
	readonly velocity?: [number, number];
	readonly loopStartMs?: number;
	readonly loopEndMs?: number;
}

export interface KitVelocityLayer {
	readonly sample: string;
	readonly velocity: [number, number];
	readonly loopStartMs?: number;
	readonly loopEndMs?: number;
}

export type KitMapping = Readonly<Record<string, string | ReadonlyArray<KitVelocityLayer>>>;

export class Instrument {
	readonly type: "instrument" | "kit";
	readonly name: string;
	readonly zones: ReadonlyArray<InstrumentZone>;
	readonly mapping?: KitMapping;
	readonly envelopes?: EnvelopesChain;
	readonly effects?: EffectsChain;

	constructor(config: { type: "instrument" | "kit"; name: string; zones: ReadonlyArray<InstrumentZone>; mapping?: KitMapping; envelopes?: EnvelopesChain; effects?: EffectsChain }) {
		this.type = config.type;
		this.name = config.name;
		this.zones = config.zones;
		this.mapping = config.mapping;
		this.envelopes = config.envelopes;
		this.effects = config.effects;
	}

	routeTo(chain: EffectsChain | EnvelopesChain): Instrument {
		if (isEnvelopesChain(chain)) {
			return new Instrument({
				type: this.type,
				name: this.name,
				zones: this.zones,
				mapping: this.mapping,
				envelopes: chain,
				effects: this.effects,
			});
		}

		return new Instrument({
			type: this.type,
			name: this.name,
			zones: this.zones,
			mapping: this.mapping,
			envelopes: this.envelopes,
			effects: chain,
		});
	}
}

export function instrument(name: string, sample: string, options: { root: Pitch; loopStartMs?: number; loopEndMs?: number }): Instrument;
export function instrument(name: string, zones: ReadonlyArray<InstrumentZone>): Instrument;
export function instrument(name: string, sampleOrZones: string | ReadonlyArray<InstrumentZone>, options?: { root: Pitch; loopStartMs?: number; loopEndMs?: number }): Instrument {
	if (!name) {
		throw new ResequenceError('EMPTY_INSTRUMENT_NAME', 'instrument(): name must not be empty');
	}

	if (typeof sampleOrZones === "string") {
		if (!options) throw new ResequenceError('MISSING_INSTRUMENT_OPTIONS', "options with root pitch required for single-sample instrument");

		return new Instrument({
			type: "instrument",
			name,
			zones: [{ sample: sampleOrZones, root: options.root, loopStartMs: options.loopStartMs, loopEndMs: options.loopEndMs }],
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
