import type { Midi, Node } from "../nodes/node";
import type { ScheduleContext } from "../rendering/schedule-context";
import type { Pitch } from "../utils/pitch";
import type { ValidateContext } from "../validate";

export interface PositionedNote {
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
	readonly notes: ReadonlyArray<PositionedNote>;

	setup(context: ScheduleContext): void;
	prepare(offsetBeats: number, context: ScheduleContext): void;
	schedule(offsetBeats: number, context: ScheduleContext): void;
	teardown(context: ScheduleContext): void;
	validate(context: ValidateContext): void;
}

export abstract class MidiPattern implements Pattern {
	abstract readonly type: string;
	abstract readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote> = [];
	abstract schedule(offsetBeats: number, context: ScheduleContext): void;
	abstract validate(context: ValidateContext): void;

	readonly outputs: Array<Node<Midi, ReadonlyArray<unknown>>> = [];

	setup(_context: ScheduleContext): void {
		return;
	}

	prepare(_offsetBeats: number, _context: ScheduleContext): void {
		return;
	}

	teardown(_context: ScheduleContext): void {
		return;
	}

	route(node: Node<Midi, ReadonlyArray<unknown>>): this {
		this.outputs.push(node);

		for (const positioned of this.notes) {
			positioned.outputs = [...positioned.outputs, node.id];
		}

		return this;
	}
}
