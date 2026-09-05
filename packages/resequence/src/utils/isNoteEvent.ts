import type { Event, NoteEvent } from "@resequence/patterns-core";

export function isNoteEvent(event: Event): event is NoteEvent {
	return event.type === "note";
}
