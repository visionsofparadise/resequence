import type { Keyframe, TempoMap } from "@resequence/patterns";
import { beatsToSeconds, evaluateAt } from "@resequence/patterns";
import type { DriverEntry } from "@resequence/web-au-core";
import { scheduleKeyframes } from "../automation/keyframe";
import type { AutomationEvent } from "../constructs/automate";
import type { Lfo } from "../automation/lfo";

export function dispatchAutomation(event: AutomationEvent, driverMap: ReadonlyMap<string, DriverEntry>, audioContext: BaseAudioContext, tempoMap: TempoMap, fromBeats: number, toBeats: number): void {
	if (Array.isArray(event.source)) {
		dispatchKeyframes(event, event.source, driverMap, tempoMap, fromBeats, toBeats);
	} else {
		dispatchLfo(event, event.source as Lfo, driverMap, audioContext, tempoMap, fromBeats, toBeats);
	}
}

function dispatchKeyframes(event: AutomationEvent, envelope: ReadonlyArray<Keyframe>, driverMap: ReadonlyMap<string, DriverEntry>, tempoMap: TempoMap, fromBeats: number, toBeats: number): void {
	if (envelope.length === 0) return;

	const absoluteKeyframes: Array<Keyframe> = envelope.map((kf) => ({ ...kf, beat: event.absoluteBeat + kf.beat }));
	const clipEndBeat = event.absoluteBeat + event.durationBeats;
	const evalBeat = Math.max(fromBeats, event.absoluteBeat);
	const initialValue = evaluateAt(absoluteKeyframes, evalBeat);
	const beatToSec = (beat: number) => beatsToSeconds(beat, tempoMap);

	for (const path of event.paths) {
		const entry = driverMap.get(path);

		if (!entry) continue;

		scheduleKeyframes(entry.node.offset, absoluteKeyframes, beatToSec, {
			fromBeat: fromBeats,
			toBeat: toBeats,
			initialValue,
		});

		if (clipEndBeat > toBeats) {
			const nextKf = absoluteKeyframes.find((kf) => kf.beat >= toBeats);

			if (nextKf && !nextKf.step) {
				const value = evaluateAt(absoluteKeyframes, toBeats);
				const toSeconds = beatToSec(toBeats);

				entry.node.offset.linearRampToValueAtTime(value, toSeconds);
			}
		}
	}
}

function dispatchLfo(event: AutomationEvent, lfo: Lfo, driverMap: ReadonlyMap<string, DriverEntry>, audioContext: BaseAudioContext, tempoMap: TempoMap, fromBeats: number, toBeats: number): void {
	if (event.absoluteBeat >= toBeats) return;

	const lfoStartSeconds = beatsToSeconds(event.absoluteBeat, tempoMap);
	const effectiveStartSeconds = lfoStartSeconds + lfo.delay;
	const windowStartSeconds = beatsToSeconds(fromBeats, tempoMap);
	const windowEndSeconds = beatsToSeconds(toBeats, tempoMap);

	if (windowEndSeconds <= effectiveStartSeconds) return;

	const freqHz = lfo.frequency;

	if (freqHz <= 0) return;

	const elapsedSeconds = Math.max(0, windowStartSeconds - effectiveStartSeconds);
	const phase = (2 * Math.PI * freqHz * elapsedSeconds) % (2 * Math.PI);
	const phaseSeconds = phase / (2 * Math.PI) / freqHz;
	const oscStartSeconds = Math.max(effectiveStartSeconds, windowStartSeconds - phaseSeconds);

	for (const path of event.paths) {
		const entry = driverMap.get(path);

		if (!entry) continue;

		const osc = audioContext.createOscillator();

		osc.type = lfo.shape;
		osc.frequency.value = freqHz;

		const depthGain = audioContext.createGain();
		const fullDepth = lfo.value;

		if (lfo.attack > 0 && windowStartSeconds < effectiveStartSeconds + lfo.attack) {
			depthGain.gain.setValueAtTime(0, effectiveStartSeconds);
			depthGain.gain.linearRampToValueAtTime(fullDepth, effectiveStartSeconds + lfo.attack);
		} else {
			depthGain.gain.value = fullDepth;
		}

		osc.connect(depthGain);
		depthGain.connect(entry.node.offset);
		osc.start(oscStartSeconds);
		osc.stop(windowEndSeconds);
	}
}
