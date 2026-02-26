import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

function mulberry32(seed: number): () => number {
	let state = seed;
	return function (): number {
		state += 0x6d2b79f5;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

export class JitterPattern extends MidiPattern {
	readonly type = "jitter" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly amount: number,
		readonly seed?: number,
	) {
		super();

		this.durationBeats = child.durationBeats;

		const rng = seed !== undefined ? mulberry32(seed) : Math.random.bind(Math);

		this.notes = child.notes.map((positionedNote) => ({
			...positionedNote,
			beat: Math.max(0, Math.round(positionedNote.beat + (rng() * 2 - 1) * amount)),
		}));
		this.metadatas = child.metadatas;
		this.automations = child.automations;
	}

	validate(context: ValidateContext): void {
		const childContext = this.outputs.length > 0 ? { ...context, insideRoute: true } : context;

		this.child.validate(childContext);
	}


	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		scheduleNotes(this.notes, offsetBeats, this.outputs, context);
		this.child.schedule(offsetBeats, context);
	}
}

export function jitter(pattern: Pattern, amount: Duration | number, seed?: number): JitterPattern {
	return new JitterPattern(pattern, resolveDuration(amount), seed);
}
