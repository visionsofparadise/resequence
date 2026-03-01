import type { ScheduleContext } from "../rendering/schedule-context";
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

	async setup(context: ScheduleContext): Promise<void> {
		if (this.children.length === 0) return;

		await Promise.allSettled(this.children.map(({ pattern }) => pattern.setup(context)));
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

export { MidiPattern } from "./midi";
export type { RoutableNode } from "./midi";
