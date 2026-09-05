import type { Event } from "../events";
import type { Note } from "../note";
import type { Port } from "../port";
import type { ResolvedTuning } from "../tuning";

export interface RelativeNote {
	readonly offsetBeats: number;
	readonly note: Note;
}

export interface RelativeChild {
	readonly offsetBeats: number;
	readonly pattern: Pattern;
}

export interface PatternProperties {
	notes: Array<RelativeNote>;
	children: Array<RelativeChild>;
	startBeat: number;
	endBeat: number;
}

export function isOutsideWindow(
	properties: PatternProperties,
	absoluteBeat: number,
	fromBeats: number,
	toBeats: number,
): boolean {
	return absoluteBeat + properties.endBeat <= fromBeats || absoluteBeat + properties.startBeat >= toBeats;
}

export function scheduleChildren(
	children: ReadonlyArray<RelativeChild>,
	absoluteBeat: number,
	fromBeats: number,
	toBeats: number,
	ports: ReadonlyArray<Port>,
	tuning?: ResolvedTuning,
): Array<Event> {
	const childEvents: Array<Event> = [];

	for (const { offsetBeats, pattern } of children) {
		const events = pattern.schedule(absoluteBeat + offsetBeats, fromBeats, toBeats, ports, tuning);

		if (events.length > 0) childEvents.push(...events);
	}

	return childEvents;
}

export function mergeScheduled(ownEvents: Array<Event>, childEvents: Array<Event>): Array<Event> {
	if (ownEvents.length === 0) return childEvents;

	if (childEvents.length === 0) return ownEvents;

	return [...ownEvents, ...childEvents];
}

export abstract class Pattern<P extends PatternProperties = PatternProperties> {
	abstract readonly type: ReadonlyArray<string>;
	abstract readonly packageName: string;
	abstract readonly unitName: string;

	static is(value: unknown): value is Pattern {
		return (
			typeof value === "object" &&
			value !== null &&
			"type" in value &&
			Array.isArray(value.type) &&
			value.type[0] === "pattern"
		);
	}

	constructor(readonly properties: P) {}

	get notes(): Array<RelativeNote> {
		return this.properties.notes;
	}

	get children(): Array<RelativeChild> {
		return this.properties.children;
	}

	get startBeat(): number {
		return this.properties.startBeat;
	}

	get endBeat(): number {
		return this.properties.endBeat;
	}

	setup(absoluteBeat: number): Array<Event> {
		const childResults = this.properties.children.map(({ offsetBeats, pattern }) =>
			pattern.setup(absoluteBeat + offsetBeats),
		);

		const ownEvents = this._setup(absoluteBeat);

		if (childResults.length === 0) return ownEvents;

		if (ownEvents.length === 0) return childResults.flat();

		return [...childResults.flat(), ...ownEvents];
	}

	_setup(_absoluteBeat: number): Array<Event> {
		return [];
	}

	schedule(
		absoluteBeat: number,
		fromBeats: number,
		toBeats: number,
		ports: ReadonlyArray<Port> = [],
		tuning?: ResolvedTuning,
	): Array<Event> {
		if (isOutsideWindow(this.properties, absoluteBeat, fromBeats, toBeats)) return [];

		const ownEvents = this._schedule(absoluteBeat, ports, tuning);
		const childEvents = scheduleChildren(this.properties.children, absoluteBeat, fromBeats, toBeats, ports, tuning);

		return mergeScheduled(ownEvents, childEvents);
	}

	_schedule(_absoluteBeat: number, _ports: ReadonlyArray<Port>, _tuning?: ResolvedTuning): Array<Event> {
		return [];
	}

	teardown(absoluteBeat: number): Array<Event> {
		if (this.properties.children.length === 0) return this._teardown(absoluteBeat);

		const ownEvents = this._teardown(absoluteBeat);

		const childResults = this.properties.children.map(({ offsetBeats, pattern }) =>
			pattern.teardown(absoluteBeat + offsetBeats),
		);

		return [...ownEvents, ...childResults.flat()];
	}

	_teardown(_absoluteBeat: number): Array<Event> {
		return [];
	}

	abstract clone(overrides: Partial<PatternProperties>): Pattern;
}
