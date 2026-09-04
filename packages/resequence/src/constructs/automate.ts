import { Pattern } from "@resequence/patterns-core";
import type { Lfo } from "../automation/lfo";
import type { Event, Keyframe, PatternProperties } from "@resequence/patterns-core";

export function isAutomationEvent(event: Event | { type: string }): event is AutomationEvent {
	return event.type === "automation";
}

export interface AutomationEvent {
	readonly type: "automation";
	readonly name: string;
	readonly absoluteBeat: number;
	readonly durationBeats: number;
	readonly paths: ReadonlyArray<string>;
	readonly source: ReadonlyArray<Keyframe> | Lfo;
}

export interface AutomationPatternProperties extends PatternProperties {
	readonly automationName: string;
	readonly paths: ReadonlyArray<string>;
	readonly source: ReadonlyArray<Keyframe> | Lfo;
}

export class AutomationPattern extends Pattern<AutomationPatternProperties> {
	readonly type = ["pattern"];
	readonly packageName = "resequence";
	readonly unitName = "automation";

	override _schedule(absoluteBeat: number): Array<Event> {
		const endBeat = this.properties.endBeat;

		return [
			{
				type: "automation",
				name: this.properties.automationName,
				absoluteBeat,
				durationBeats: endBeat,
				paths: this.properties.paths,
				source: this.properties.source,
			},
		];
	}

	clone(overrides: Partial<PatternProperties>): AutomationPattern {
		return new AutomationPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function automate(
	name: string,
	paths: string | ReadonlyArray<string>,
	source: ReadonlyArray<Keyframe> | Lfo,
): AutomationPattern {
	const resolvedPaths = typeof paths === "string" ? [paths] : [...paths];

	for (const path of resolvedPaths) {
		if (path === "tempo") {
			throw new Error(`automate() cannot target "tempo". Use tempo() with keyframes instead.`);
		}

		const segments = path.split(".");

		if (segments.length < 2) {
			throw new Error(`Automation path must be nodeId.property, got: ${path}`);
		}
	}

	let endBeat: number;

	if (Array.isArray(source)) {
		const keyframes = source as ReadonlyArray<Keyframe>;

		if (keyframes.length === 0) {
			throw new Error("automate(): keyframes array must not be empty");
		}

		endBeat = Math.max(...keyframes.map((kf) => kf.beat));
	} else {
		endBeat = 0;
	}

	return new AutomationPattern({
		notes: [],
		children: [],
		startBeat: 0,
		endBeat,
		automationName: name,
		paths: resolvedPaths,
		source,
	});
}
