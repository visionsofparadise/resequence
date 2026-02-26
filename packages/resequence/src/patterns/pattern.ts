import type { ScheduleContext } from "../rendering/schedule-context";
import type { MidiUnit } from "../units/midi-unit";
import type { Pitch, TuningConfig } from "../utils/pitch";
import type { ValidateContext } from "../validate";
import type { AutomatePattern } from "./automate";

export interface Metadata {
	readonly name?: string;
	readonly description?: string;
	readonly marker?: string;
	readonly region?: string;
	readonly tempo?: number;
	readonly timeSignature?: readonly [number, number];
	readonly tuning?: TuningConfig;
}

export interface PositionedMetadata {
	readonly beat: number;
	readonly meta: Metadata;
}

export interface PositionedAutomation {
	readonly beat: number;
	readonly automation: AutomatePattern;
}

export interface ScoreNote {
	readonly beat: number;
	readonly pitch: Pitch;
	readonly durationBeats?: number;
	readonly velocity?: number;
	readonly lyric?: string;
	readonly cc?: Partial<Record<number, number>>;
	outputs: Array<string | undefined>;
}

export interface Pattern {
	readonly type: string;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;
	readonly sampleKeys: ReadonlySet<string>;

	setup(context: ScheduleContext): void;
	schedule(offsetBeats: number, context: ScheduleContext): void;
	teardown(context: ScheduleContext): void;
	validate(context: ValidateContext): void;
}

export abstract class MidiPattern implements Pattern {
	abstract readonly type: string;
	abstract readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote> = [];
	readonly metadatas: ReadonlyArray<PositionedMetadata> = [];
	readonly automations: ReadonlyArray<PositionedAutomation> = [];
	abstract schedule(offsetBeats: number, context: ScheduleContext): void;
	abstract validate(context: ValidateContext): void;

	readonly outputs: Array<MidiUnit> = [];

	get sampleKeys(): ReadonlySet<string> {
		const keys = new Set<string>();

		if ("child" in this && isPattern((this as { child: unknown }).child)) {
			for (const key of (this as { child: Pattern }).child.sampleKeys) keys.add(key);
		} else if ("children" in this && Array.isArray((this as { children: unknown }).children)) {
			for (const child of (this as { children: ReadonlyArray<unknown> }).children) {
				if (isPattern(child)) for (const key of child.sampleKeys) keys.add(key);
			}
		}

		for (const out of this.outputs) {
			for (const key of out.sampleKeys) keys.add(key);
		}

		return keys;
	}

	setup(context: ScheduleContext): void {
		for (const out of this.outputs) out.setup(context);
	}

	teardown(context: ScheduleContext): void {
		for (const out of this.outputs) out.teardown(context);
	}

	route(node: MidiUnit): this {
		this.outputs.push(node);

		for (const positioned of this.notes) {
			positioned.outputs = [...positioned.outputs, node.id];
		}

		return this;
	}
}

function isPattern(value: unknown): value is Pattern {
	return typeof value === "object" && value !== null && "type" in value && "durationBeats" in value;
}
