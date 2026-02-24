import type { Instrument } from "../instrument/instrument";
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

	setup(_context: ScheduleContext): void { return; }
	teardown(_context: ScheduleContext): void { return; }

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

	setup(context: ScheduleContext): void {
		this.node.setup({ ...context, instrument: this.instrument });
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (context.trackFilter && !context.trackFilter.has(this.instrument.name)) return;

		this.node.schedule(offsetTicks, { ...context, instrument: this.instrument });
	}

	teardown(context: ScheduleContext): void {
		this.node.teardown({ ...context, instrument: this.instrument });
	}

	validate(context: ValidateContext): void {
		const name = this.instrument.name;
		const existing = context.routing.get(name);
		if (existing) {
			existing.push(this.instrument);
		} else {
			context.routing.set(name, [this.instrument]);
		}

		const previousInsideRoute = context.insideRoute;
		context.insideRoute = true;
		this.node.validate(context);
		context.insideRoute = previousInsideRoute;
	}
}
