import type { ScheduleContext } from "../rendering/schedule-context";
import type { MidiUnit } from "../units/midi-unit";
import { Pattern } from "./pattern";
import type { PatternNode } from "./pattern";

export interface RoutableNode extends PatternNode {
	readonly outputs?: ReadonlyArray<MidiUnit>;
}

export abstract class MidiPattern extends Pattern {
	readonly outputs: Array<MidiUnit>;

	constructor(node: RoutableNode) {
		super(node);
		this.outputs = node.outputs ? [...node.outputs] : [];
	}

	route(node: MidiUnit): this {
		this.outputs.push(node);

		return this;
	}

	protected override overrideNode(overrides: Partial<PatternNode>): RoutableNode {
		return {
			...super.overrideNode(overrides),
			outputs: this.outputs,
		};
	}

	async setup(context: ScheduleContext): Promise<void> {
		await Promise.allSettled(this.outputs.map(async (output) => output.setup(context)));
		await Promise.allSettled(this.children.map(({ pattern }) => pattern.setup(context)));
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
