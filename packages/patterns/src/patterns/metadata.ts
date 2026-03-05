import type { Event } from "../events";
import { PatternsError } from "../error";
import type { Port } from "../port";
import type { ResolvedTuning } from "../tuning";
import type { PatternProperties } from "./pattern";
import { Pattern } from "./pattern";

export interface Metadata {
	readonly name?: string;
	readonly description?: string;
	readonly tuning?: ResolvedTuning;
	readonly timeSignature?: readonly [number, number];
	readonly marker?: string;
	readonly region?: string;
}

export interface MetadataProperties extends PatternProperties {
	readonly meta: Metadata;
}

export class MetadataPattern extends Pattern<MetadataProperties> {
	static is(value: unknown): value is MetadataPattern {
		return value instanceof MetadataPattern;
	}

	constructor(properties: MetadataProperties) {
		super(properties);

		if (properties.meta.timeSignature !== undefined && (properties.meta.timeSignature[0] < 1 || properties.meta.timeSignature[1] < 1)) {
			throw new PatternsError("INVALID_TIME_SIGNATURE", `timeSignature(): values must be >= 1, got [${properties.meta.timeSignature[0]}, ${properties.meta.timeSignature[1]}]`);
		}
	}

	override schedule(absoluteBeat: number, fromBeats: number, toBeats: number, ports: ReadonlyArray<Port> = [], tuning?: ResolvedTuning): Array<Event> {
		if (absoluteBeat + this.properties.endBeat <= fromBeats || absoluteBeat + this.properties.startBeat >= toBeats) return [];

		const effectiveTuning = this.properties.meta.tuning ?? tuning;
		const childEvents: Array<Event> = [];

		for (const { offsetBeats, pattern } of this.properties.children) {
			const events = pattern.schedule(absoluteBeat + offsetBeats, fromBeats, toBeats, ports, effectiveTuning);

			if (events.length > 0) childEvents.push(...events);
		}

		return childEvents;
	}

	clone(overrides: Partial<PatternProperties>): MetadataPattern {
		return new MetadataPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function metadata(pattern: Pattern, meta: Metadata): MetadataPattern {
	return new MetadataPattern({ notes: [], children: [{ offsetBeats: 0, pattern }], startBeat: pattern.startBeat, endBeat: pattern.endBeat, meta });
}

export const tuning = (pattern: Pattern, config: NonNullable<Metadata["tuning"]>): MetadataPattern => metadata(pattern, { tuning: config });

export const timeSignature = (pattern: Pattern, sig: readonly [number, number]): MetadataPattern => metadata(pattern, { timeSignature: sig });

export const marker = (pattern: Pattern, name: string): MetadataPattern => metadata(pattern, { marker: name });

export const cue = marker;

export const region = (pattern: Pattern, name: string): MetadataPattern => metadata(pattern, { region: name });
