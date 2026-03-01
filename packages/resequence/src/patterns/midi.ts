import type { ScheduleContext } from "../rendering/schedule-context";
import type { MidiUnit } from "../units/midi-unit";
import type { OptionalProperties } from "../utils/RequiredProperties";
import type { PatternProperties } from "./pattern";
import { Pattern } from "./pattern";

export interface MidiPatternProperties extends PatternProperties {
	readonly outputs: Array<MidiUnit>;
}

export abstract class MidiPattern extends Pattern {
	readonly properties: MidiPatternProperties;

	constructor(properties: OptionalProperties<MidiPatternProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	get outputs(): Array<MidiUnit> {
		return this.properties.outputs;
	}

	route(node: MidiUnit): this {
		this.outputs.push(node);

		return this;
	}

	async setup(context: ScheduleContext): Promise<void> {
		await Promise.allSettled(this.outputs.map(async (output) => output.setup(context)));
		await Promise.allSettled(this.properties.children.map(({ pattern }) => pattern.setup(context)));
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (offsetBeats + this.properties.endBeat <= context.fromBeats || offsetBeats + this.properties.startBeat >= context.toBeats) return;

		const routedContext = this.outputs.length > 0 ? { ...context, outputs: [...context.outputs, ...this.outputs] } : context;

		for (const { offsetBeats: noteOffset, note } of this.properties.notes) {
			routedContext.dispatch(note, offsetBeats + noteOffset, routedContext.outputs, routedContext);
		}

		for (const { offsetBeats: childOffset, pattern } of this.properties.children) {
			pattern.schedule(offsetBeats + childOffset, routedContext);
		}
	}

	teardown(context: ScheduleContext): void {
		for (const output of this.outputs) output.teardown(context);
		for (const { pattern } of this.properties.children) pattern.teardown(context);
	}
}
