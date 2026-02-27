import type { ScheduleContext } from "../rendering/schedule-context";
import type { MidiUnit } from "../units/midi-unit";
import type { Pitch, TuningConfig } from "../utils/pitch";
import type { ValidateContext } from "../validate";
import type { AutomatePattern } from "./automate";

export interface TempoKeyframe {
	readonly beat: number;
	readonly bpm: number;
	readonly curve?: "step" | "linear" | "exponential";
}

export interface Metadata {
	readonly name?: string;
	readonly description?: string;
	readonly marker?: string;
	readonly region?: string;
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

export interface ScoreSlide {
	readonly beat: number;
	readonly pitch: Pitch;
	readonly curve: number;
}

export interface ScoreNote {
	readonly beat: number;
	readonly pitch: Pitch;
	readonly durationBeats?: number;
	readonly velocity?: number;
	readonly lyric?: string;
	readonly cc?: Partial<Record<number, number>>;
	readonly slides?: ReadonlyArray<ScoreSlide>;
	outputs: Array<string | undefined>;
}

export abstract class Pattern {
	abstract readonly type: string;
	abstract readonly durationBeats: number;
	abstract readonly notes: ReadonlyArray<ScoreNote>;
	abstract readonly metadatas: ReadonlyArray<PositionedMetadata>;
	abstract readonly automations: ReadonlyArray<PositionedAutomation>;
	abstract readonly sampleKeys: ReadonlySet<string>;
	abstract readonly moduleUrls: ReadonlySet<string>;

	abstract setup(context: ScheduleContext): void;
	abstract schedule(offsetBeats: number, context: ScheduleContext): void;
	abstract teardown(context: ScheduleContext): void;
	abstract validate(context: ValidateContext): void;
}

export abstract class MidiPattern extends Pattern {
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

	get moduleUrls(): ReadonlySet<string> {
		const urls = new Set<string>();

		if ("child" in this && isPattern((this as { child: unknown }).child)) {
			for (const url of (this as { child: Pattern }).child.moduleUrls) urls.add(url);
		} else if ("children" in this && Array.isArray((this as { children: unknown }).children)) {
			for (const child of (this as { children: ReadonlyArray<unknown> }).children) {
				if (isPattern(child)) for (const url of child.moduleUrls) urls.add(url);
			}
		}

		for (const out of this.outputs) {
			for (const url of out.collectModuleUrls()) urls.add(url);
		}

		return urls;
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
	return value instanceof Pattern;
}
