import { ResequenceError } from "../error";
import type { InstrumentZone, KitMapping } from "../instrument/instrument";
import type { ScheduleContext } from "../rendering/schedule-context";
import { ticksToSeconds } from "../rendering/ticks-to-seconds";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import { scheduleLfo } from "../utils/lfo";
import type { Pitch } from "../utils/pitch";
import { resolvePitch } from "../utils/pitch";
import type { ValidateContext } from "../validate";
import type { PositionedNote } from "./pattern";
import { MidiPattern } from "./pattern";

const ENVELOPE_PARAMS = ["attack", "hold", "decay", "sustain", "release"] as const;

export class NotePattern extends MidiPattern {
	readonly type = "note" as const;
	readonly durationTicks: number;

	constructor(
		readonly pitch: Pitch,
		readonly duration: Duration,
		readonly velocity: number,
		readonly lyric?: string,
	) {
		super();

		if (velocity < 0 || velocity > 127) {
			throw new ResequenceError("INVALID_VELOCITY", `note(): velocity must be 0-127, got ${velocity}`);
		}

		this.durationTicks = resolveDuration(duration);
	}

	transpose(interval: number): NotePattern {
		const midi = resolvePitch(this.pitch) + interval;

		return new NotePattern(midi, this.duration, this.velocity, this.lyric);
	}

	reverse(): NotePattern {
		return new NotePattern(this.pitch, this.duration, this.velocity, this.lyric);
	}

	validate(context: ValidateContext): void {
		if (!context.insideRoute) {
			context.warnings.push({
				code: "ORPHANED_NOTES",
				message: `Note '${this.pitch}' is not routed to any instrument — it won't produce sound`,
			});
		}
	}

	getMidi(offset = 0, trackName?: string): Array<PositionedNote> {
		return [
			{
				tick: offset,
				pitch: resolvePitch(this.pitch),
				durationTicks: this.durationTicks,
				velocity: this.velocity,
				lyric: this.lyric,
				trackName,
			},
		];
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (offsetTicks + this.durationTicks <= context.fromTicks || offsetTicks >= context.toTicks) return;

		if (!context.instrument) return;

		const midi = resolvePitch(this.pitch);
		const offsetSeconds = ticksToSeconds(offsetTicks, context.tempo);
		const durationSeconds = ticksToSeconds(this.durationTicks, context.tempo);

		const inst = context.instrument;
		let buffer: AudioBuffer | undefined;
		let playbackRate = 1;
		let loopStartMs: number | undefined;
		let loopEndMs: number | undefined;

		if (inst.type === "instrument") {
			const zone = findZone(inst.zones, midi, this.velocity);

			if (!zone) return;

			buffer = context.sampleMap.get(zone.sample);
			loopStartMs = zone.loopStartMs;
			loopEndMs = zone.loopEndMs;

			const rootMidi = resolvePitch(zone.root);
			playbackRate = 2 ** ((midi - rootMidi) / 12);
		} else {
			const entry = inst.mapping ? findKitEntry(inst.mapping, this.pitch, this.velocity) : undefined;

			if (!entry) return;

			buffer = context.sampleMap.get(entry.sample);
			loopStartMs = entry.loopStartMs;
			loopEndMs = entry.loopEndMs;
		}

		if (!buffer) return;

		const source = context.audioContext.createBufferSource();
		source.buffer = buffer;
		source.playbackRate.value = playbackRate;

		if (loopStartMs !== undefined && loopEndMs !== undefined) {
			source.loop = true;
			source.loopStart = loopStartMs / 1000;
			source.loopEnd = loopEndMs / 1000;
		}

		const destination = context.effectsMap[inst.name] ?? context.audioContext.destination;
		const envelopes = inst.envelopes;

		let maxRelease = 0;

		if (envelopes) {
			let chainInput: AudioNode = source;
			let chainOutput: AudioNode = source;

			for (const [envelopeKey, envelopeDef] of Object.entries(envelopes)) {
				if (envelopeDef.type === "pitchEnvelope") {
					source.detune.value = 0;

					if (envelopeDef.envelope) {
						const attack = envelopeDef.envelope.attack ?? 0.01;
						const decay = envelopeDef.envelope.decay ?? 0.1;
						const sustain = envelopeDef.envelope.sustain ?? 0;
						const release = envelopeDef.envelope.release ?? 0.1;

						if (release > maxRelease) maxRelease = release;

						scheduleEnvelopeAdsr(source.detune, offsetSeconds, durationSeconds, attack, decay, sustain, release, envelopeDef.envelope.amount * 100);
					}

					if (envelopeDef.lfo) {
						scheduleLfo(envelopeDef.lfo, source.detune, context.audioContext, offsetSeconds, offsetSeconds + durationSeconds + maxRelease, 100, context.tempo);
					}

					continue;
				}

				const worklet = new AudioWorkletNode(context.audioContext, "envelope-processor");
				const workletParams = worklet.parameters as unknown as ReadonlyMap<string, AudioParam>;
				const gate = workletParams.get("gate");

				if (gate) {
					gate.setValueAtTime(1, offsetSeconds);
					gate.setValueAtTime(0, offsetSeconds + durationSeconds);
				}

				for (const param of ENVELOPE_PARAMS) {
					const path = `${inst.name}.${envelopeKey}.${param}`;
					const driver = context.driverMap.get(path);
					const audioParam = workletParams.get(param);

					if (!audioParam) continue;

					if (driver) {
						audioParam.value = 0;
						driver.connect(audioParam);
					} else if (envelopeDef.envelope) {
						const defaultValues: Record<string, number> = { attack: 0.01, hold: 0, decay: 0.1, sustain: 0.7, release: 0.1 };
						audioParam.value = (envelopeDef.envelope as Record<string, number | undefined>)[param] ?? defaultValues[param] ?? 0;

						if (param === "release") {
							const releaseVal = audioParam.value;
							if (releaseVal > maxRelease) maxRelease = releaseVal;
						}
					}
				}

				if (envelopeDef.lfo) {
					const lfoGain = context.audioContext.createGain();
					worklet.connect(lfoGain);
					scheduleLfo(envelopeDef.lfo, lfoGain.gain, context.audioContext, offsetSeconds, offsetSeconds + durationSeconds + maxRelease, 1, context.tempo);
					chainOutput = lfoGain;
				} else {
					chainOutput = worklet;
				}

				if (chainInput === source) {
					chainInput = worklet;
				}
			}

			if (chainInput !== source) {
				source.connect(chainInput);
				chainOutput.connect(destination);
			} else {
				source.connect(destination);
			}
		} else {
			source.connect(destination);
		}

		source.start(offsetSeconds);
		source.stop(offsetSeconds + durationSeconds + maxRelease);
	}
}

function scheduleEnvelopeAdsr(audioParam: AudioParam, startTime: number, duration: number, attack: number, decay: number, sustain: number, release: number, peakValue: number): void {
	const sustainValue = peakValue * sustain;
	const noteOff = startTime + duration;

	audioParam.setValueAtTime(0, startTime);
	audioParam.linearRampToValueAtTime(peakValue, startTime + attack);
	audioParam.linearRampToValueAtTime(sustainValue, startTime + attack + decay);
	audioParam.setValueAtTime(sustainValue, noteOff);
	audioParam.linearRampToValueAtTime(0, noteOff + release);
}

function findZone(zones: ReadonlyArray<InstrumentZone>, midi: number, velocity: number): InstrumentZone | undefined {
	const velocityMatches = zones.filter((zone) => !zone.velocity || (velocity >= zone.velocity[0] && velocity <= zone.velocity[1]));

	if (velocityMatches.length === 0) return zones[0];

	let closest = velocityMatches[0];

	if (!closest) return undefined;

	let closestDist = Math.abs(resolvePitch(closest.root) - midi);

	for (const zone of velocityMatches) {
		const dist = Math.abs(resolvePitch(zone.root) - midi);
		if (dist < closestDist) {
			closest = zone;
			closestDist = dist;
		}
	}

	return closest;
}

function findKitEntry(mapping: KitMapping, pitch: Pitch, velocity: number): { sample: string; loopStartMs?: number; loopEndMs?: number } | undefined {
	const key = typeof pitch === "number" ? midiToName(pitch) : pitch;

	const entry = mapping[key];

	if (!entry) return undefined;
	if (typeof entry === "string") return { sample: entry };

	for (const layer of entry) {
		if (velocity >= layer.velocity[0] && velocity <= layer.velocity[1]) {
			return { sample: layer.sample, loopStartMs: layer.loopStartMs, loopEndMs: layer.loopEndMs };
		}
	}

	const first = entry[0];

	return first ? { sample: first.sample, loopStartMs: first.loopStartMs, loopEndMs: first.loopEndMs } : undefined;
}

function midiToName(midi: number): string {
	const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
	const octave = Math.floor(midi / 12) - 1;
	const name = names[midi % 12];

	return `${name}${octave}`;
}

export function note(pitch: Pitch, duration: Duration, options?: { velocity?: number; lyric?: string }): NotePattern {
	return new NotePattern(pitch, duration, options?.velocity ?? 100, options?.lyric);
}
