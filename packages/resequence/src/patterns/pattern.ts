import type { Instrument } from "../instrument";

export interface PositionedNote {
	readonly tick: number;
	readonly pitch: number;
}

export interface Pattern {
	readonly type: string;
	readonly durationTicks: number;
	transpose(interval: number): Pattern;
	reverse(): Pattern;
	getNotes(offset?: number): Array<PositionedNote>;
}

export abstract class MidiPattern implements Pattern {
	abstract readonly type: string;
	abstract readonly durationTicks: number;
	abstract transpose(interval: number): Pattern;
	abstract reverse(): Pattern;
	abstract getNotes(offset?: number): Array<PositionedNote>;

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

	getNotes(offset = 0): Array<PositionedNote> {
		return this.node.getNotes(offset);
	}
}
