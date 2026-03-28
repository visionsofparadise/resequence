import type { Event, MetadataEvent } from "../events";
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
	readonly type = ["pattern", "metadata"] as const;

	static override is(value: unknown): value is MetadataPattern {
		return Pattern.is(value) && value.type[1] === "metadata";
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
		const meta = this.properties.meta;
		const ownEvents: Array<Event> = [];

		const metadataEvent: MetadataEvent = {
			type: "metadata",
			absoluteBeat,
			tuning: meta.tuning,
			timeSignature: meta.timeSignature,
			marker: meta.marker,
			region: meta.region,
			regionEndBeat: meta.region !== undefined ? absoluteBeat + this.properties.endBeat : undefined,
			name: meta.name,
			description: meta.description,
		};

		const hasContent = meta.tuning !== undefined || meta.timeSignature !== undefined ||
			meta.marker !== undefined || meta.region !== undefined ||
			meta.name !== undefined || meta.description !== undefined;

		if (hasContent) ownEvents.push(metadataEvent);

		for (const { offsetBeats, pattern } of this.properties.children) {
			const events = pattern.schedule(absoluteBeat + offsetBeats, fromBeats, toBeats, ports, effectiveTuning);

			if (events.length > 0) ownEvents.push(...events);
		}

		return ownEvents;
	}

	clone(overrides: Partial<PatternProperties>): MetadataPattern {
		return new MetadataPattern({
			...this.properties,
			...overrides,
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
