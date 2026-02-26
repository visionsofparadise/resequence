import type { ScheduleContext } from "../../rendering/schedule-context";
import { Unit } from "../unit";

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

function createLinkwitzRiley(context: BaseAudioContext, frequency: number, type: BiquadFilterType): [BiquadFilterNode, BiquadFilterNode] {
	const first = context.createBiquadFilter();
	first.type = type;
	first.frequency.value = frequency;
	first.Q.value = 0.707;

	const second = context.createBiquadFilter();
	second.type = type;
	second.frequency.value = frequency;
	second.Q.value = 0.707;

	first.connect(second);

	return [first, second];
}

export class CrossoverEffectUnit extends Unit {
	readonly type = "crossover" as const;
	readonly id = undefined;

	public readonly parsedBands: Array<ParsedBand>;
	public bandUnits: Array<Array<Unit>> = [];
	protected readonly innerUnits: ReadonlyArray<Unit>;

	constructor(options: CrossoverOptions) {
		super();
		this.parsedBands = parseBands(options);
		this.innerUnits = this.parsedBands.flatMap((band) => [...band.units]);
	}

	protected _setup(context: ScheduleContext): void {
		const mergerGain = context.audioContext.createGain();
		mergerGain.gain.value = 1;

		const inputGain = context.audioContext.createGain();
		inputGain.gain.value = 1;

		for (let bandIndex = 0; bandIndex < this.parsedBands.length; bandIndex++) {
			const band = this.parsedBands[bandIndex];
			if (!band) continue;
			const bandNodes: Array<Unit> = [];

			let bandInput: AudioNode = inputGain;

			if (bandIndex > 0) {
				const prevBand = this.parsedBands[bandIndex - 1];
				if (prevBand?.frequency !== undefined) {
					const [first, second] = createLinkwitzRiley(context.audioContext, prevBand.frequency, "highpass");
					inputGain.connect(first);
					bandInput = second;
				}
			}

			if (band.frequency !== undefined) {
				const [first, second] = createLinkwitzRiley(context.audioContext, band.frequency, "lowpass");
				bandInput.connect(first);
				bandInput = second;
			} else if (bandInput === inputGain && bandIndex > 0) {
				const prevBand = this.parsedBands[bandIndex - 1];
				if (prevBand?.frequency !== undefined) {
					const [first, second] = createLinkwitzRiley(context.audioContext, prevBand.frequency, "highpass");
					inputGain.connect(first);
					bandInput = second;
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
					firstUnit.setup(context);
					const firstEntry = firstUnit.entryNodes[0];
					if (firstEntry) {
						bandInput.connect(firstEntry);
					}
					for (const exit of lastUnit.exitNodes) {
						exit.connect(mergerGain);
					}
				}

				bandNodes.push(...band.units);
			} else {
				bandInput.connect(mergerGain);
			}

			this.bandUnits.push(bandNodes);
		}

		this.entryNodes.push(inputGain);
		this.exitNodes.push(mergerGain);
	}

	protected _teardown(context: ScheduleContext): void {
		for (const units of this.bandUnits) {
			for (const unit of units) {
				unit.teardown(context);
			}
		}
		this.bandUnits = [];
	}
}

export function crossover(options: CrossoverOptions): CrossoverEffectUnit {
	return new CrossoverEffectUnit(options);
}

export const multiband = crossover;
