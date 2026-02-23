import type { Instrument } from "../instrument/instrument";
import type { ScheduleContext } from "../rendering/schedule-context";

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
	schedule(offsetTicks: number, context: ScheduleContext): void;
}

export abstract class MidiPattern implements Pattern {
	abstract readonly type: string;
	abstract readonly durationTicks: number;
	abstract transpose(interval: number): Pattern;
	abstract reverse(): Pattern;
	abstract getMidi(offset?: number, trackName?: string): Array<PositionedNote>;
	abstract schedule(offsetTicks: number, context: ScheduleContext): void;

	routeTo(instrument: Instrument): RoutedPattern {
		return new RoutedPattern(this, instrument);
	}
}

export class RoutedPattern extends MidiPattern {
	readonly type = "routed" as const;
	readonly durationTicks: number;

	constructor(
		readonly node: Pattern,
		readonly instrument: Instrument,
	) {
		super();
		this.durationTicks = node.durationTicks;
	}

	transpose(interval: number): RoutedPattern {
		return new RoutedPattern(this.node.transpose(interval), this.instrument);
	}

	reverse(): RoutedPattern {
		return new RoutedPattern(this.node.reverse(), this.instrument);
	}

	getMidi(offset = 0, trackName?: string): Array<PositionedNote> {
		return this.node.getMidi(offset, trackName ?? this.instrument.name);
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (context.trackFilter && !context.trackFilter.has(this.instrument.name)) return;

		this.node.schedule(offsetTicks, { ...context, instrument: this.instrument });
	}
}
