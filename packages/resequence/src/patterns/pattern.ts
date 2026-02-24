import type { Midi, Node } from "../nodes/node";
import type { ScheduleContext } from "../rendering/schedule-context";
import type { ValidateContext } from "../validate";

export interface PositionedNote {
	readonly tick: number;
	readonly pitch: number;
	readonly durationTicks?: number;
	readonly velocity?: number;
	readonly lyric?: string;
	readonly trackName?: string;
}

export interface Pattern {
	readonly type: string;
	readonly durationTicks: number;
	transpose(interval: number): Pattern;
	reverse(): Pattern;
	getMidi(offset?: number, trackName?: string): Array<PositionedNote>;
	setup(context: ScheduleContext): void;
	prepare(offsetTicks: number, context: ScheduleContext): void;
	schedule(offsetTicks: number, context: ScheduleContext): void;
	teardown(context: ScheduleContext): void;
	validate(context: ValidateContext): void;
}

export abstract class MidiPattern implements Pattern {
	abstract readonly type: string;
	abstract readonly durationTicks: number;
	abstract transpose(interval: number): Pattern;
	abstract reverse(): Pattern;
	abstract getMidi(offset?: number, trackName?: string): Array<PositionedNote>;
	abstract schedule(offsetTicks: number, context: ScheduleContext): void;
	abstract validate(context: ValidateContext): void;

	readonly outputs: Array<Node<Midi, ReadonlyArray<unknown>>> = [];

	setup(_context: ScheduleContext): void {
		return;
	}

	prepare(_offsetTicks: number, _context: ScheduleContext): void {
		return;
	}

	teardown(_context: ScheduleContext): void {
		return;
	}

	route(node: Node<Midi, ReadonlyArray<unknown>>): this {
		this.outputs.push(node);
		return this;
	}

	protected resolveTrackName(fallback?: string): string | undefined {
		for (const node of this.outputs) {
			if (node.id) return node.id;
		}

		return fallback;
	}
}
