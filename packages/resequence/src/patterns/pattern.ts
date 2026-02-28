import type { ScheduleContext } from "../rendering/schedule-context";
import type { MidiUnit } from "../units/midi-unit";
import type { ValidateContext } from "../validate";
import type { ScoreNote } from "./note";

export interface RelativeNote {
	readonly offsetBeats: number;
	readonly note: ScoreNote;
}

export interface RelativeChild {
	readonly offsetBeats: number;
	readonly pattern: Pattern;
}

export interface PatternNode {
	readonly notes: ReadonlyArray<RelativeNote>;
	readonly children: ReadonlyArray<RelativeChild>;
	readonly startBeat: number;
	readonly endBeat: number;
}

export abstract class Pattern implements PatternNode {
	readonly notes: ReadonlyArray<RelativeNote>;
	readonly children: ReadonlyArray<RelativeChild>;
	readonly startBeat: number;
	readonly endBeat: number;

	constructor(node: PatternNode) {
		this.notes = node.notes;
		this.children = node.children;
		this.startBeat = node.startBeat;
		this.endBeat = node.endBeat;
	}

	protected overrideNode(overrides: Partial<PatternNode>): PatternNode {
		return {
			notes: overrides.notes ?? this.notes,
			children: overrides.children ?? this.children,
			startBeat: overrides.startBeat ?? this.startBeat,
			endBeat: overrides.endBeat ?? this.endBeat,
		};
	}

	get sampleKeys(): ReadonlySet<string> {
		const keys = new Set<string>();

		for (const { pattern } of this.children) {
			for (const key of pattern.sampleKeys) keys.add(key);
		}

		return keys;
	}

	get moduleUrls(): ReadonlySet<string> {
		const urls = new Set<string>();

		for (const { pattern } of this.children) {
			for (const url of pattern.moduleUrls) urls.add(url);
		}

		return urls;
	}

	setup(context: ScheduleContext): void {
		for (const { pattern } of this.children) pattern.setup(context);
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (offsetBeats + this.endBeat <= context.fromBeats || offsetBeats + this.startBeat >= context.toBeats) return;

		for (const { offsetBeats: childOffset, pattern } of this.children) {
			pattern.schedule(offsetBeats + childOffset, context);
		}
	}

	validate(context: ValidateContext): void {
		for (const { pattern } of this.children) {
			pattern.validate(context);
		}
	}

	teardown(context: ScheduleContext): void {
		for (const { pattern } of this.children) pattern.teardown(context);
	}

	abstract clone(overrides: Partial<PatternNode>): Pattern;
}

export abstract class MidiPattern extends Pattern {
	readonly outputs: Array<MidiUnit> = [];

	get sampleKeys(): ReadonlySet<string> {
		const keys = new Set<string>();

		for (const { pattern } of this.children) {
			for (const key of pattern.sampleKeys) keys.add(key);
		}

		for (const out of this.outputs) {
			for (const key of out.sampleKeys) keys.add(key);
		}

		return keys;
	}

	get moduleUrls(): ReadonlySet<string> {
		const urls = new Set<string>();

		for (const { pattern } of this.children) {
			for (const url of pattern.moduleUrls) urls.add(url);
		}

		for (const output of this.outputs) {
			for (const url of output.collectModuleUrls()) urls.add(url);
		}

		return urls;
	}

	route(node: MidiUnit): this {
		this.outputs.push(node);

		return this;
	}

	setup(context: ScheduleContext): void {
		for (const output of this.outputs) output.setup(context);
		for (const { pattern } of this.children) pattern.setup(context);
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (offsetBeats + this.endBeat <= context.fromBeats || offsetBeats + this.startBeat >= context.toBeats) return;

		const routedContext = this.outputs.length > 0 ? { ...context, outputs: [...context.outputs, ...this.outputs] } : context;

		for (const { offsetBeats: noteOffset, note } of this.notes) {
			routedContext.dispatch(note, offsetBeats + noteOffset, routedContext.outputs, routedContext);
		}

		for (const { offsetBeats: childOffset, pattern } of this.children) {
			pattern.schedule(offsetBeats + childOffset, routedContext);
		}
	}

	teardown(context: ScheduleContext): void {
		for (const output of this.outputs) output.teardown(context);
		for (const { pattern } of this.children) pattern.teardown(context);
	}
}
