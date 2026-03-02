import type { ScheduleContext } from "../../rendering/schedule-context";
import { getOrCreateDriver } from "../../utils/driver";
import type { VoiceNote } from "../midi-unit";
import { MidiUnit } from "../midi-unit";
import type { SetupResult, Unit } from "../unit";
import { Composite } from "./composite";

export interface InterceptOptions {
	readonly override?: Readonly<Record<string, number>>;
	readonly insert?: ReadonlyArray<Unit>;
}

export class InterceptUnit extends MidiUnit {
	readonly inner: Unit;
	private readonly options: InterceptOptions;

	constructor(inner: Unit, options: InterceptOptions) {
		super();

		this.inner = inner;
		this.options = options;

		for (const target of inner.targets) {
			this.targets.push(target);
		}
		inner.targets.length = 0;

		if (inner instanceof Composite) {
			const tail = "tail" in inner ? (inner as { tail: Unit }).tail : undefined;
			if (tail) {
				for (const target of tail.targets) {
					if (!this.targets.includes(target)) this.targets.push(target);
				}
				tail.targets.length = 0;
			}
		}
	}

	protected _setup(context: ScheduleContext): SetupResult | Promise<SetupResult> {
		const { insert, override: overrides } = this.options;
		const { inner } = this;

		let entryUnit: Unit = inner;

		if (insert && insert.length > 0) {
			for (let index = 0; index < insert.length - 1; index++) {
				const current = insert[index];
				const next = insert[index + 1];
				if (current && next) current.to(next);
			}
			const last = insert[insert.length - 1];
			if (last) last.to(inner);
			const first = insert[0];
			if (first) entryUnit = first;
		}

		const finish = (): SetupResult => {
			if (overrides && inner.id) {
				for (const [paramName, value] of Object.entries(overrides)) {
					const path = `${inner.id}.${paramName}`;
					const driver = getOrCreateDriver(path, value, context);
					driver.offset.value = value;
				}
			}

			return { entries: [entryUnit], exits: [inner] };
		};

		const setupResult = entryUnit.setup(context);

		if (setupResult instanceof Promise) {
			return setupResult.then(finish);
		}

		return finish();
	}

	protected _schedule(voiceNote: VoiceNote, scheduleContext: ScheduleContext): void {
		if (this.inner instanceof MidiUnit) {
			this.inner.schedule(voiceNote, scheduleContext);
		}
	}

	protected _teardown(context: ScheduleContext): void {
		if (this.options.insert) {
			for (const unit of this.options.insert) {
				unit.teardown(context);
			}
		}
		this.inner.teardown(context);
	}
}

export function intercept(unit: Unit, options: InterceptOptions): InterceptUnit {
	return new InterceptUnit(unit, options);
}
