import type { UnitContext } from "../context";
import type { SetupResult, UnitInput } from "../unit";
import { Unit, type UnitProperties } from "../unit";
import { linearGain } from "./gain";
import { linkwitzRiley } from "./linkwitz-riley";

type BandSpec = [number, ...Array<Unit>] | [...Array<Unit>];

export interface CrossoverOptions {
	readonly [bandName: string]: BandSpec;
}

interface ParsedBand {
	readonly name: string;
	readonly frequency: number | undefined;
	readonly units: ReadonlyArray<Unit>;
}

function parseBands(options: CrossoverOptions): Array<ParsedBand> {
	const bands: Array<ParsedBand> = [];

	for (const [name, spec] of Object.entries(options)) {
		if (typeof spec[0] === "number") {
			bands.push({ name, frequency: spec[0], units: spec.slice(1) as Array<Unit> });
		} else {
			bands.push({ name, frequency: undefined, units: spec as Array<Unit> });
		}
	}

	bands.sort((left, right) => (left.frequency ?? Infinity) - (right.frequency ?? Infinity));

	return bands;
}

export interface CrossoverProperties extends UnitProperties {
	readonly options: CrossoverOptions;
	readonly previousProperties?: CrossoverProperties;
}

export class CrossoverEffectUnit extends Unit {
	readonly type = ["unit", "crossover"] as const;

	static override is(value: unknown): value is CrossoverEffectUnit {
		return Unit.is(value) && value.type[1] === "crossover";
	}

	declare readonly properties: CrossoverProperties;
	public readonly parsedBands: Array<ParsedBand>;
	public bandUnits: Array<Array<Unit>> = [];

	constructor(properties: UnitInput<CrossoverProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
		this.parsedBands = parseBands(properties.options);
	}

	get options(): CrossoverOptions { return this.properties.options; }

	clone(overrides?: Partial<CrossoverProperties>): CrossoverEffectUnit {
		return new CrossoverEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const inputUnit = linearGain({ level: 1 });
		const mergerUnit = linearGain({ level: 1 });

		for (let bandIndex = 0; bandIndex < this.parsedBands.length; bandIndex++) {
			const band = this.parsedBands[bandIndex];

			if (!band) continue;
			const bandNodes: Array<Unit> = [];

			let bandHead: Unit = inputUnit;

			if (bandIndex > 0) {
				const prevBand = this.parsedBands[bandIndex - 1];

				if (prevBand?.frequency !== undefined) {
					const hp = linkwitzRiley(prevBand.frequency, "highpass");

					inputUnit.to(hp);
					bandHead = hp;
					bandNodes.push(hp);
				}
			}

			if (band.frequency !== undefined) {
				const lp = linkwitzRiley(band.frequency, "lowpass");

				bandHead.to(lp);
				bandHead = lp;
				bandNodes.push(lp);
			} else if (bandHead === inputUnit && bandIndex > 0) {
				const prevBand = this.parsedBands[bandIndex - 1];

				if (prevBand?.frequency !== undefined) {
					const hp = linkwitzRiley(prevBand.frequency, "highpass");

					inputUnit.to(hp);
					bandHead = hp;
					bandNodes.push(hp);
				}
			}

			if (band.units.length > 0) {
				for (let unitIndex = 0; unitIndex < band.units.length - 1; unitIndex++) {
					const current = band.units[unitIndex];
					const next = band.units[unitIndex + 1];

					if (current && next) current.to(next);
				}

				const firstUnit = band.units[0];
				const lastUnit = band.units[band.units.length - 1];

				if (firstUnit && lastUnit) {
					bandHead.to(firstUnit);
					lastUnit.to(mergerUnit);
				}

				bandNodes.push(...band.units);
			} else {
				bandHead.to(mergerUnit);
			}

			this.bandUnits.push(bandNodes);
		}

		await inputUnit.setup(context);

		return { entries: [inputUnit], exits: [mergerUnit] };
	}

	protected override _teardown(context: UnitContext): void {
		for (const units of this.bandUnits) {
			for (const unit of units) {
				unit.teardown(context);
			}
		}

		this.bandUnits = [];
	}
}

export function crossover(options: CrossoverOptions): CrossoverEffectUnit {
	return new CrossoverEffectUnit({ options });
}

export const multiband = crossover;
