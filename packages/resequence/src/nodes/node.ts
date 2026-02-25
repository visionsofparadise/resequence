import type { ScheduleContext } from "../rendering/schedule-context";

export type Midi = [context: NoteContext];
export type MidiAudio = [audio: AudioNode, context: NoteContext];

export interface NoteContext {
	readonly frequency: number;
	readonly velocity: number;
	readonly startTime: number;
	readonly stopTime: number;
	readonly cleanupTime: number;
	readonly cc?: Partial<Record<number, number>>;
}

export abstract class Node<In extends ReadonlyArray<unknown>, Out extends ReadonlyArray<unknown>> {
	abstract readonly id?: string;
	readonly outputs: Array<Node<Out, ReadonlyArray<unknown>>> = [];

	to<S extends ReadonlyArray<unknown>>(node: Node<Out, S>): Node<Out, S> {
		this.outputs.push(node as Node<Out, ReadonlyArray<unknown>>);

		return node;
	}

	abstract setup(context: ScheduleContext): void;
	abstract prepare(note: NoteContext, context: ScheduleContext): void;
	abstract schedule(...args: [...In, ScheduleContext]): void;
	abstract teardown(context: ScheduleContext): void;
}
