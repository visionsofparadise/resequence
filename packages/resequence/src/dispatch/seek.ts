import type { Keyframe } from "@resequence/patterns";
import { evaluateAt } from "@resequence/patterns";
import { beatsToSeconds } from "@resequence/patterns";
import type { TempoMap } from "@resequence/patterns";
import type { DriverEntry } from "@resequence/units";
import type { AutomationEvent } from "../constructs/automate";
import { lastBefore } from "../utils/sorted";

interface AutomationClip {
	readonly endBeat: number;
	readonly paths: ReadonlyArray<string>;
	readonly keyframes: ReadonlyArray<Keyframe>;
	readonly finalValue: number;
}

export function seekAutomationFromEvents(
	events: ReadonlyArray<AutomationEvent>,
	seekBeat: number,
	driverMap: ReadonlyMap<string, DriverEntry>,
	tempoMap: TempoMap,
): void {
	const clips: Array<AutomationClip> = [];

	for (const event of events) {
		if (!Array.isArray(event.source)) continue;

		const envelope = event.source as ReadonlyArray<Keyframe>;
		const absoluteKeyframes: Array<Keyframe> = envelope.map((kf) => ({
			...kf,
			beat: event.absoluteBeat + kf.beat,
		}));

		clips.push({
			endBeat: event.absoluteBeat + event.durationBeats,
			paths: event.paths,
			keyframes: absoluteKeyframes,
			finalValue: evaluateAt(absoluteKeyframes, event.absoluteBeat + event.durationBeats),
		});
	}

	const byPathEnd = new Map<string, Array<AutomationClip>>();

	for (const clip of clips) {
		for (const path of clip.paths) {
			let list = byPathEnd.get(path);

			if (!list) {
				list = [];
				byPathEnd.set(path, list);
			}

			list.push(clip);
		}
	}

	for (const list of byPathEnd.values()) {
		list.sort((left, right) => left.endBeat - right.endBeat);
	}

	const seekSeconds = beatsToSeconds(seekBeat, tempoMap);

	for (const [path, sortedClips] of byPathEnd) {
		const lastCompleted = lastBefore(sortedClips, seekBeat, (clip) => clip.endBeat);

		if (lastCompleted) {
			const entry = driverMap.get(path);

			if (entry) {
				entry.node.offset.setValueAtTime(lastCompleted.finalValue, seekSeconds);
			}
		}
	}
}
