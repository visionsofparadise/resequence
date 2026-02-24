import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export interface LevelPropOptions {
	readonly value?: number;
	readonly randomize?: number;
	readonly expand?: number;
	readonly compress?: number;
	readonly min?: number;
	readonly max?: number;
	readonly seed?: number;
}

export type LevelProp = number | LevelPropOptions;

export interface LevelConfig {
	readonly velocity?: LevelProp;
	readonly cc?: Partial<Record<number, LevelProp>>;
}

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

function applyProp(originalValues: ReadonlyArray<number>, spec: LevelProp): Array<number> {
	if (typeof spec === "number") {
		return originalValues.map(() => spec);
	}

	const mean = spec.expand !== undefined || spec.compress !== undefined ? originalValues.reduce((sum, currentValue) => sum + currentValue, 0) / originalValues.length : 0;
	const rng = spec.seed !== undefined ? mulberry32(spec.seed) : Math.random.bind(Math);
	const scaleFactor = spec.expand ?? spec.compress;

	return originalValues.map((originalValue) => {
		let computed = spec.value ?? originalValue;

		if (scaleFactor !== undefined) {
			computed = mean + scaleFactor * (originalValue - mean);
		}

		if (spec.randomize !== undefined) {
			computed += (rng() * 2 - 1) * spec.randomize;
		}

		computed = Math.round(computed);

		if (spec.min !== undefined) computed = Math.max(spec.min, computed);
		if (spec.max !== undefined) computed = Math.min(spec.max, computed);

		return computed;
	});
}

export class LevelPattern extends MidiPattern {
	readonly type = "level" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly config: LevelConfig,
	) {
		super();

		this.durationTicks = child.durationTicks;

		let notes = child.notes.slice();

		if (config.velocity !== undefined) {
			const velocitySpec = config.velocity;
			const velocities = notes.map((positionedNote) => positionedNote.velocity ?? 100);
			const newVelocities = applyProp(velocities, velocitySpec);

			notes = notes.map((positionedNote, noteIndex) => ({
				...positionedNote,
				velocity: newVelocities[noteIndex],
			}));
		}

		if (config.cc) {
			for (const [ccKey, ccSpec] of Object.entries(config.cc)) {
				if (ccSpec === undefined) continue;

				const ccNum = Number(ccKey);
				const ccValues = notes.map((positionedNote) => positionedNote.cc?.[ccNum] ?? 0);
				const newCcValues = applyProp(ccValues, ccSpec);

				notes = notes.map((positionedNote, noteIndex) => ({
					...positionedNote,
					cc: { ...positionedNote.cc, [ccNum]: newCcValues[noteIndex] },
				}));
			}
		}

		this.notes = notes;
	}

	validate(context: ValidateContext): void {
		const childContext = this.outputs.length > 0 ? { ...context, insideRoute: true } : context;

		this.child.validate(childContext);
	}

	prepare(offsetTicks: number, context: ScheduleContext): void {
		if (!isInScope(offsetTicks, this.durationTicks, context)) return;
		prepareNotes(this.notes, offsetTicks, this.outputs, context);
		this.child.prepare(offsetTicks, context);
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (!isInScope(offsetTicks, this.durationTicks, context)) return;
		scheduleNotes(this.notes, offsetTicks, this.outputs, context);
		this.child.schedule(offsetTicks, context);
	}
}

export function level(pattern: Pattern, config: LevelConfig): LevelPattern {
	return new LevelPattern(pattern, config);
}

export function humanize(pattern: Pattern, amount: number, seed?: number): LevelPattern {
	return new LevelPattern(pattern, { velocity: { randomize: amount, seed } });
}
