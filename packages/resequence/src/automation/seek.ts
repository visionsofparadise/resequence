import { AutomatePattern } from "../patterns/automate";
import type { AnyResolvedKeyframe } from "../patterns/automate";
import type { Pattern } from "../patterns/pattern";
import type { ScheduleContext } from "../rendering/schedule-context";
import { beatsToSeconds } from "../rendering/tempo-map";
import { lastBefore } from "../utils/sorted";
import type { AbsoluteKeyframe } from "./utils";
import { evaluateAt } from "./utils";

interface AutomationClip {
	readonly endBeat: number;
	readonly paths: ReadonlyArray<string>;
	readonly keyframes: ReadonlyArray<AbsoluteKeyframe>;
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
	if (pattern instanceof AutomatePattern && Array.isArray(pattern.source)) {
		const envelope = pattern.source as ReadonlyArray<AnyResolvedKeyframe>;
		const durationBeats = pattern.endBeat - pattern.startBeat;

		const keyframes: Array<AbsoluteKeyframe> = envelope.map((kf) => {
			if (kf.kind === "curve") {
				return { kind: "curve" as const, beat: offsetBeats + kf.timeBeats, durationBeats: kf.durationBeats, values: kf.values };
			}

			return { kind: "point" as const, beat: offsetBeats + kf.timeBeats, value: kf.value, curve: kf.curve };
		});

		clips.push({
			endBeat: offsetBeats + durationBeats,
			paths: [...pattern.paths],
			keyframes,
			finalValue: evaluateAt(keyframes, offsetBeats + durationBeats),
		});
	}

	for (const { offsetBeats: childOffset, pattern: child } of pattern.children) {
		collectAutomationClips(child, offsetBeats + childOffset, clips);
	}
}
