import { CompositeUnit, LiveParameter, MidiUnit } from "@resequence/web-au-core";
import { z } from "zod";
import type { AnyUnit, NoteEvent, SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";

export interface InterceptOptions {
	readonly override?: Readonly<Record<string, number>>;
	readonly insert?: ReadonlyArray<AnyUnit>;
}

export class InterceptUnit extends MidiUnit {
	readonly type = ["unit", "midi"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "intercept";

	readonly inner: AnyUnit;
	private readonly options: InterceptOptions;

	constructor(input: { inner: AnyUnit; options: InterceptOptions; targets?: Array<AnyUnit> } & UnitInput) {
		super(input, z.object({}));
		this.inner = input.inner;
		this.options = input.options;

		if (input.targets) this.targets.push(...input.targets);
	}

	protected override _setup(_context: UnitContext): SetupResult {
		const { insert, override: overrides } = this.options;
		const { inner } = this;

		let entryUnit: AnyUnit = inner;

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

		if (overrides && inner.id) {
			for (const [paramName, normalizedValue] of Object.entries(overrides)) {
				const param = inner.parameters[paramName];

				if (param instanceof LiveParameter) {
					param.set(param.min + normalizedValue * (param.max - param.min));
				}
			}
		}

		return { entries: [entryUnit], exits: [inner] };
	}

	protected override _schedule(noteEvent: NoteEvent, context: UnitContext): void {
		if (this.inner instanceof MidiUnit) {
			this.inner.schedule(noteEvent, context);
		}
	}

	protected override _teardown(context: UnitContext): void {
		if (this.options.insert) {
			for (const unit of this.options.insert) {
				unit.teardown(context);
			}
		}

		this.inner.teardown(context);
	}
}

export function intercept(unit: AnyUnit, options: InterceptOptions): InterceptUnit {
	if (options.override && !unit.id) {
		(unit as { id: string }).id = crypto.randomUUID();
	}

	const targets: Array<AnyUnit> = [...unit.targets];

	unit.targets.length = 0;

	if (unit instanceof CompositeUnit) {
		const tail = "tail" in unit ? (unit as { tail: AnyUnit }).tail : undefined;

		if (tail) {
			for (const target of tail.targets) {
				if (!targets.includes(target)) targets.push(target);
			}

			tail.targets.length = 0;
		}
	}

	return new InterceptUnit({ inner: unit, options, targets });
}
