import type { ScheduleContext } from "../../rendering/schedule-context";
import type { MidiAudio, NoteContext } from "../node";
import { Node } from "../node";

export abstract class EffectNode extends Node<MidiAudio, MidiAudio> {
	readonly effectsId: string;

	constructor(readonly id?: string) {
		super();
		this.effectsId = id ?? crypto.randomUUID();
	}

	setup(_context: ScheduleContext): void {
		return;
	}

	prepare(_note: NoteContext, _context: ScheduleContext): void {
		return;
	}

	teardown(_context: ScheduleContext): void {
		return;
	}

	protected forward(audio: AudioNode, sharedNode: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		audio.connect(sharedNode);

		if (this.outputs.length === 0) {
			sharedNode.connect(scheduleContext.audioContext.destination);
		} else {
			for (const node of this.outputs) {
				node.schedule(sharedNode, noteContext, scheduleContext);
			}
		}
	}

	abstract schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void;
}
