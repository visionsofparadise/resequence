import { frequencyToNoteAndBend, pitchToFrequency } from "../frequency";
import { N } from "../tunings/chromatic";
import { isOutsideWindow, mergeScheduled, Pattern, scheduleChildren } from "./pattern";
import type { Event, NoteEvent } from "../events";
import type { Port } from "../port";
import type { ResolvedTuning } from "../tuning";
import type { PatternProperties } from "./pattern";

export interface MidiPatternProperties extends PatternProperties {
	readonly ports?: ReadonlyArray<Port>;
}

export abstract class MidiPattern<P extends MidiPatternProperties = MidiPatternProperties> extends Pattern<P> {
	readonly type = ["pattern", "midi"];

	static override is(value: unknown): value is MidiPattern {
		return Pattern.is(value) && value.type[1] === "midi";
	}

	readonly ports: Array<Port>;

	constructor(properties: P) {
		super(properties);
		this.ports = properties.ports ? [...properties.ports] : [];
	}

	route(key: string, channel?: number): this {
		this.ports.push({ key, channel: channel ?? 0 });

		return this;
	}

	override schedule(
		absoluteBeat: number,
		fromBeats: number,
		toBeats: number,
		parentPorts: ReadonlyArray<Port> = [],
		tuning?: ResolvedTuning,
	): Array<Event> {
		if (isOutsideWindow(this.properties, absoluteBeat, fromBeats, toBeats)) return [];

		const effectivePorts = this.ports.length > 0 ? [...parentPorts, ...this.ports] : parentPorts;

		const ownEvents = this._schedule(absoluteBeat, effectivePorts, tuning);
		const childEvents = scheduleChildren(
			this.properties.children,
			absoluteBeat,
			fromBeats,
			toBeats,
			effectivePorts,
			tuning,
		);

		return mergeScheduled(ownEvents, childEvents);
	}

	override _schedule(absoluteBeat: number, ports: ReadonlyArray<Port>, tuning?: ResolvedTuning): Array<Event> {
		if (this.properties.notes.length === 0 || ports.length === 0) return [];

		const events: Array<NoteEvent> = [];
		const effectiveTuning = tuning ?? N.config;

		for (const { offsetBeats, note } of this.properties.notes) {
			const noteStart = absoluteBeat + offsetBeats + note.startBeat;
			const durationBeats = note.endBeat - note.startBeat;
			const frequency = pitchToFrequency(note.pitch, effectiveTuning);
			const { note: midiNote, bend } = frequencyToNoteAndBend(frequency);

			for (const port of ports) {
				events.push({
					type: "note",
					port: port.key,
					channel: port.channel,
					pitch: note.pitch,
					startBeat: noteStart,
					durationBeats,
					velocity: note.velocity,
					frequency,
					midiNote,
					bend,
					lyric: note.lyric,
					cc: note.cc,
					slides: note.slides,
					tuning,
				});
			}
		}

		return events;
	}
}
