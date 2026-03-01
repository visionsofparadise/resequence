import type { Keyframe } from "../automation/keyframe";
import { evaluateAt } from "../automation/keyframe";
import { AutomatePattern } from "../patterns/automate";
import type { Pattern } from "../patterns/pattern";
import type { ScheduleContext } from "../rendering/schedule-context";
import { beatsToSeconds } from "../rendering/tempo-map";
import { lastBefore } from "../utils/sorted";

interface AutomationClip {
	readonly endBeat: number;
	readonly paths: ReadonlyArray<string>;
	readonly keyframes: ReadonlyArray<Keyframe>;
	readonly finalValue: number;
}

export function seekAutomation(pattern: Pattern, seekBeat: number, context: ScheduleContext): void {
	const clips: Array<AutomationClip> = [];
	collectAutomationClips(pattern, 0, clips);

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

	const seekSeconds = beatsToSeconds(seekBeat, context.tempoMap);

	for (const [path, sortedClips] of byPathEnd) {
		const lastCompleted = lastBefore(sortedClips, seekBeat, (clip) => clip.endBeat);

		if (lastCompleted) {
			const driver = context.driverMap.get(path);

			if (driver) {
				driver.offset.setValueAtTime(lastCompleted.finalValue, seekSeconds);
			}
		}
	}
}

function collectAutomationClips(pattern: Pattern, offsetBeats: number, clips: Array<AutomationClip>): void {
	if (pattern instanceof AutomatePattern && Array.isArray(pattern.properties.source)) {
		const envelope = pattern.properties.source as ReadonlyArray<Keyframe>;
		const durationBeats = pattern.endBeat - pattern.startBeat;

		const keyframes: Array<Keyframe> = envelope.map((kf) => ({ ...kf, beat: offsetBeats + kf.beat }));

		clips.push({
			endBeat: offsetBeats + durationBeats,
			paths: [...pattern.properties.paths],
			keyframes,
			finalValue: evaluateAt(keyframes, offsetBeats + durationBeats),
		});
	}

	for (const { offsetBeats: childOffset, pattern: child } of pattern.children) {
		collectAutomationClips(child, offsetBeats + childOffset, clips);
	}
}
