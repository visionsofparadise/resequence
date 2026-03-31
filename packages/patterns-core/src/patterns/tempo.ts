import type { Event, Keyframe, MetadataEvent } from "../events";
import { PatternsError } from "../error";
import type { Port } from "../port";
import type { ResolvedTuning } from "../tuning";
import type { PatternProperties } from "./pattern";
import { Pattern } from "./pattern";

const BPM_RANGE = 1000;

export function normalizeBpm(bpm: number): number {
	return bpm / BPM_RANGE;
}

export function denormalizeBpm(value: number): number {
	return value * BPM_RANGE;
}

export interface TempoOptions {
	readonly keyframes?: ReadonlyArray<Keyframe>;
	readonly override?: boolean;
}

export interface TempoProperties extends PatternProperties {
	readonly bpm: number;
	readonly keyframes: ReadonlyArray<Keyframe>;
	readonly isOverride: boolean;
}

export class TempoPattern extends Pattern<TempoProperties> {
	readonly type = ["pattern"];
	readonly packageName = "@resequence/patterns-core";
	readonly unitName = "tempo";

	constructor(properties: TempoProperties) {
		TempoPattern.validate(properties);
		super(properties);
	}

	private static validate(properties: TempoProperties): void {
		if (properties.bpm <= 0) {
			throw new PatternsError("INVALID_TEMPO", `tempo(): bpm must be greater than 0, got ${properties.bpm}`);
		}

		for (const keyframe of properties.keyframes) {
			if (keyframe.beat < 0) {
				throw new PatternsError("INVALID_TEMPO", `tempo(): keyframe beat must be >= 0, got ${keyframe.beat}`);
			}

			if (keyframe.value < 0) {
				throw new PatternsError("INVALID_TEMPO", `tempo(): keyframe value must be >= 0, got ${keyframe.value}`);
			}
		}
	}

	override _schedule(absoluteBeat: number, _ports: ReadonlyArray<Port>, _tuning?: ResolvedTuning): Array<Event> {
		const event: MetadataEvent = {
			type: "metadata",
			absoluteBeat,
			bpm: this.properties.bpm,
			tempoKeyframes: this.properties.keyframes.length > 0 ? this.properties.keyframes : undefined,
			tempoIsOverride: this.properties.isOverride || undefined,
		};

		return [event];
	}

	clone(overrides: Partial<PatternProperties>): TempoPattern {
		return new TempoPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function tempo(pattern: Pattern, bpm: number, options?: TempoOptions): TempoPattern {
	return new TempoPattern({
		notes: [],
		children: [{ offsetBeats: 0, pattern }],
		startBeat: pattern.startBeat,
		endBeat: pattern.endBeat,
		bpm,
		keyframes: options?.keyframes ?? [],
		isOverride: options?.override ?? false,
	});
}
