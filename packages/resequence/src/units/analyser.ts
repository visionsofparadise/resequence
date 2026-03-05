import type { ScheduleContext } from "../rendering/schedule-context";
import type { SetupResult, UnitInput, UnitProperties } from "./unit";
import { Unit } from "./unit";

export interface AnalyserProperties extends UnitProperties {
	readonly fftSize: number;
}

export class AnalyserUnit extends Unit {
	readonly type = ["unit", "analyser"] as const;

	static is(value: unknown): value is AnalyserUnit {
		return Unit.is(value) && value.type[1] === "analyser";
	}

	readonly properties: AnalyserProperties;
	public analyserNode: AnalyserNode | undefined;

	constructor(properties: UnitInput<AnalyserProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get fftSize(): number {
		return this.properties.fftSize;
	}

	clone(overrides?: Partial<AnalyserProperties>): AnalyserUnit {
		return new AnalyserUnit({ ...this.properties, ...overrides });
	}

	protected _setup(context: ScheduleContext): SetupResult {
		const analyserNode = context.audioContext.createAnalyser();
		analyserNode.fftSize = this.fftSize;

		this.analyserNode = analyserNode;

		return { entries: [analyserNode] };
	}

	protected _teardown(_context: ScheduleContext): void {
		this.analyserNode = undefined;
	}
}

export function analyser({ fftSize = 256, id }: { fftSize?: number; id?: string } = {}): AnalyserUnit {
	return new AnalyserUnit({ fftSize, id });
}
