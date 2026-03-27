import type { MidiUnitInput, MidiUnitProperties, NoteEvent, SetupResult, Unit, UnitContext } from "@resequence/web-au-core";
import { CompositeUnit, getOrCreateDriver, MidiUnit } from "@resequence/web-au-core";

export interface InterceptOptions {
	readonly override?: Readonly<Record<string, number>>;
	readonly insert?: ReadonlyArray<Unit>;
}

export interface InterceptProperties extends MidiUnitProperties {
	readonly inner: Unit;
	readonly options: InterceptOptions;
}

export class InterceptUnit extends MidiUnit {
	readonly type = ["unit", "midi", "intercept"] as const;
	declare readonly properties: InterceptProperties;

	static override is(value: unknown): value is InterceptUnit {
		return MidiUnit.is(value) && value.type[2] === "intercept";
	}

	readonly inner: Unit;
	private readonly options: InterceptOptions;

	constructor(properties: MidiUnitInput<InterceptProperties>) {
		super(properties);
		this.properties = {
			...properties,
			targets: properties.targets ?? [],
			modDeclarations: properties.modDeclarations ?? [],
			noteModDeclarations: properties.noteModDeclarations ?? [],
		};
		this.inner = properties.inner;
		this.options = properties.options;
	}

	clone(overrides?: Partial<InterceptProperties>): InterceptUnit {
		return new InterceptUnit({ ...this.properties, ...overrides });
	}

	protected override _setup(context: UnitContext): SetupResult {
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

		if (overrides && inner.id) {
			for (const [paramName, value] of Object.entries(overrides)) {
				const path = `${inner.id}.${paramName}`;
				const entry = getOrCreateDriver(path, value, context);

				entry.node.offset.value = value;
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

export function intercept(unit: Unit, options: InterceptOptions): InterceptUnit {
	if (options.override && !unit.id) {
		unit = unit.clone({ id: crypto.randomUUID() });
	}

	const targets: Array<Unit> = [...unit.targets];

	unit.targets.length = 0;

	if (unit instanceof CompositeUnit) {
		const tail = "tail" in unit ? (unit as { tail: Unit }).tail : undefined;

		if (tail) {
			for (const target of tail.targets) {
				if (!targets.includes(target)) targets.push(target);
			}

			tail.targets.length = 0;
		}
	}

	return new InterceptUnit({ inner: unit, options, targets });
}
