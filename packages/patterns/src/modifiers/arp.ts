import {
	collectNotes,
	flatModifyNotes,
	ModifierPattern,
	pitchKey,
	sequence,
	toPattern,
	walkNotes,
} from "@resequence/patterns-core";
import { I } from "@resequence/patterns-utils";
import { mulberry32 } from "../utils/mulberry32";
import type { Event, ModifierProperties, Note, Pattern, PatternProperties, Pitch } from "@resequence/patterns-core";

interface ArpStep {
	readonly absoluteBeat: number;
	readonly pitch: Pitch;
	readonly velocity: number;
	readonly duration: number;
}

export interface ArpProperties extends ModifierProperties {
	readonly mapping: Pattern;
}

export class ArpPattern extends ModifierPattern<ArpProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "arp";

	override _setup(): Array<Event> {
		const sourceEntries: Array<{ id: string; absoluteStart: number; absoluteEnd: number; pitch: Pitch }> = [];

		walkNotes(this, (note, { id, absoluteOffset }) => {
			sourceEntries.push({
				id,
				absoluteStart: absoluteOffset + note.startBeat,
				absoluteEnd: absoluteOffset + note.endBeat,
				pitch: note.pitch,
			});
		});

		const mappingPattern = this.properties.mapping;
		const mappingNotes = collectNotes(mappingPattern).sort((noteA, noteB) => noteA.absoluteBeat - noteB.absoluteBeat);

		const mappingDuration = mappingPattern.endBeat - mappingPattern.startBeat;

		if (sourceEntries.length === 0 || mappingNotes.length === 0 || mappingDuration === 0) {
			return [];
		}

		const mappingPitchKeys = [...new Set(mappingNotes.map((mappingNote) => pitchKey(mappingNote.note.pitch)))].sort(
			(keyA, keyB) => keyA - keyB,
		);
		const mappingPitchRank = new Map(mappingPitchKeys.map((key, index) => [key, index]));

		const events: Array<{ beat: number; delta: number }> = [];

		for (const source of sourceEntries) {
			events.push({ beat: source.absoluteStart, delta: 1 });
			events.push({ beat: source.absoluteEnd, delta: -1 });
		}

		events.sort((eventA, eventB) => eventA.beat - eventB.beat || eventB.delta - eventA.delta);

		const segments: Array<{ start: number; end: number }> = [];
		let activeCount = 0;
		let segmentStart = 0;

		for (const event of events) {
			if (activeCount === 0 && event.delta > 0) segmentStart = event.beat;

			activeCount += event.delta;

			if (activeCount === 0) segments.push({ start: segmentStart, end: event.beat });
		}

		const stepsByNote = new Map<string, Array<ArpStep>>();

		for (const segment of segments) {
			let cycle = 0;
			let stepIndex = 0;

			for (;;) {
				const mappingNote = mappingNotes[stepIndex % mappingNotes.length];

				if (!mappingNote) break;

				const absoluteBeat = segment.start + cycle * mappingDuration + mappingNote.absoluteBeat;

				if (absoluteBeat >= segment.end) break;

				const heldPitches = new Map<number, Pitch>();

				for (const source of sourceEntries) {
					if (source.absoluteStart <= absoluteBeat && source.absoluteEnd > absoluteBeat) {
						const key = pitchKey(source.pitch);

						if (!heldPitches.has(key)) heldPitches.set(key, source.pitch);
					}
				}

				if (heldPitches.size > 0) {
					const pool = [...heldPitches.entries()]
						.sort((entryA, entryB) => entryA[0] - entryB[0])
						.map(([, pitch]) => pitch);

					const lowestPitch = pool[0];

					if (!lowestPitch) {
						stepIndex++;

						if (stepIndex % mappingNotes.length === 0) cycle++;

						continue;
					}

					const rank = mappingPitchRank.get(pitchKey(mappingNote.note.pitch)) ?? 0;
					const selectedPitch = pool[rank] ?? lowestPitch;
					const selectedKey = pitchKey(selectedPitch);
					const stepDuration = mappingNote.note.endBeat - mappingNote.note.startBeat;

					for (const source of sourceEntries) {
						if (
							pitchKey(source.pitch) === selectedKey &&
							source.absoluteStart <= absoluteBeat &&
							source.absoluteEnd > absoluteBeat
						) {
							let steps = stepsByNote.get(source.id);

							if (!steps) {
								steps = [];
								stepsByNote.set(source.id, steps);
							}

							steps.push({
								absoluteBeat,
								pitch: selectedPitch,
								velocity: mappingNote.note.velocity,
								duration: stepDuration,
							});

							break;
						}
					}
				}

				stepIndex++;

				if (stepIndex % mappingNotes.length === 0) cycle++;
			}
		}

		flatModifyNotes(this, (_scoreNote, { id, absoluteOffset }) => {
			const steps = stepsByNote.get(id);

			if (!steps || steps.length === 0) return [];

			return steps.map((step) => ({
				pitch: step.pitch,
				startBeat: step.absoluteBeat - absoluteOffset,
				endBeat: step.absoluteBeat - absoluteOffset + step.duration,
				velocity: step.velocity,
			}));
		});

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): ArpPattern {
		return new ArpPattern({ mapping: this.properties.mapping, input: this.properties.input });
	}
}

export function arp(pattern: Pattern | Note, mappingPattern: Pattern): ArpPattern {
	const resolved = toPattern(pattern);

	return new ArpPattern({ mapping: mappingPattern, input: resolved });
}

function ascendingStepsOf(voices: number, rate: number): Array<Note> {
	const steps: Array<Note> = [];

	for (let voiceIndex = 0; voiceIndex < voices; voiceIndex++) {
		steps.push(I(voiceIndex)(rate));
	}

	return steps;
}

export function arpUp(voices: number, rate: number): Pattern {
	return sequence(...ascendingStepsOf(voices, rate));
}

export function arpDown(voices: number, rate: number): Pattern {
	const steps: Array<Note> = [];

	for (let voiceIndex = voices - 1; voiceIndex >= 0; voiceIndex--) {
		steps.push(I(voiceIndex)(rate));
	}

	return sequence(...steps);
}

export function arpUpDown(voices: number, rate: number): Pattern {
	const steps = ascendingStepsOf(voices, rate);

	for (let voiceIndex = voices - 2; voiceIndex >= 1; voiceIndex--) {
		steps.push(I(voiceIndex)(rate));
	}

	return sequence(...steps);
}

export function arpRandom(voices: number, rate: number, seed?: number): Pattern {
	const rng = seed !== undefined ? mulberry32(seed) : Math.random.bind(Math);
	const steps: Array<Note> = [];

	for (let stepIndex = 0; stepIndex < voices; stepIndex++) {
		steps.push(I(Math.floor(rng() * voices))(rate));
	}

	return sequence(...steps);
}
