import type { Midi, Node, NoteContext } from "../nodes/node";
import type { PositionedNote } from "../patterns/pattern";
import type { ScheduleContext } from "./schedule-context";
import { ticksToSeconds } from "./ticks-to-seconds";

export function isInScope(offsetTicks: number, durationTicks: number, context: ScheduleContext): boolean {
	return offsetTicks + durationTicks > context.fromTicks && offsetTicks < context.toTicks;
}

export function prepareNotes(notes: ReadonlyArray<PositionedNote>, offsetTicks: number, outputs: ReadonlyArray<Node<Midi, ReadonlyArray<unknown>>>, context: ScheduleContext): void {
	if (outputs.length === 0) return;

	for (const positioned of notes) {
		const noteTick = offsetTicks + positioned.tick;
		const noteEnd = noteTick + (positioned.durationTicks ?? 0);

		if (noteEnd <= context.fromTicks || noteTick >= context.toTicks) continue;

		const noteCtx = buildNoteContext(positioned, noteTick, context);

		for (const node of outputs) {
			node.prepare(noteCtx, context);
		}
	}
}

export function scheduleNotes(notes: ReadonlyArray<PositionedNote>, offsetTicks: number, outputs: ReadonlyArray<Node<Midi, ReadonlyArray<unknown>>>, context: ScheduleContext): void {
	if (outputs.length === 0) return;

	for (const positioned of notes) {
		const noteTick = offsetTicks + positioned.tick;
		const noteEnd = noteTick + (positioned.durationTicks ?? 0);

		if (noteEnd <= context.fromTicks || noteTick >= context.toTicks) continue;

		const noteCtx = buildNoteContext(positioned, noteTick, context);

		for (const node of outputs) {
			node.schedule(noteCtx, context);
		}
	}
}

function buildNoteContext(note: PositionedNote, absoluteTick: number, context: ScheduleContext): NoteContext {
	const startTime = ticksToSeconds(absoluteTick, context.tempo);
	const stopTime = ticksToSeconds(absoluteTick + (note.durationTicks ?? 0), context.tempo);

	return {
		frequency: midiToFrequency(note.pitch),
		velocity: note.velocity ?? 100,
		startTime,
		stopTime,
		cleanupTime: stopTime + 5,
	};
}

function midiToFrequency(midi: number): number {
	return 440 * 2 ** ((midi - 69) / 12);
}
