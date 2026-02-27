import type { PositionedAutomation } from "../patterns/pattern";
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

export function seekAutomation(automations: ReadonlyArray<PositionedAutomation>, seekBeat: number, context: ScheduleContext): void {
	const clips: Array<AutomationClip> = [];

	for (const { beat, automation } of automations) {
		if (!Array.isArray(automation.source)) continue;

		const keyframes: Array<AbsoluteKeyframe> = automation.envelope.map((kf) => {
			if (kf.kind === "curve") {
				return { kind: "curve" as const, beat: beat + kf.timeBeats, durationBeats: kf.durationBeats, values: kf.values };
			}

			return { kind: "point" as const, beat: beat + kf.timeBeats, value: kf.value, curve: kf.curve };
		});

		clips.push({
			endBeat: beat + automation.durationBeats,
			paths: automation.paths,
			keyframes,
			finalValue: evaluateAt(keyframes, beat + automation.durationBeats),
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
