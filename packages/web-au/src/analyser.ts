import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";

import { Unit } from "@resequence/web-au-core";

export interface AnalyserProperties extends UnitProperties {
	readonly fftSize: number;
}

export class AnalyserUnit extends Unit {
	readonly type = ["unit", "analyser"] as const;

	static override is(value: unknown): value is AnalyserUnit {
		return Unit.is(value) && value.type[1] === "analyser";
	}

	declare readonly properties: AnalyserProperties;
	public analyserNode: AnalyserNode | undefined;

	constructor(properties: UnitInput<AnalyserProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get fftSize(): number {
		return this.properties.fftSize;
	}

	protected override _setup(context: UnitContext): SetupResult {
		const analyserNode = context.audioContext.createAnalyser();

		analyserNode.fftSize = this.fftSize;

		this.analyserNode = analyserNode;

		return { entries: [analyserNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.analyserNode = undefined;
	}
}

export function analyser({ fftSize = 256, id }: { fftSize?: number; id?: string } = {}): AnalyserUnit {
	return new AnalyserUnit({ fftSize, id });
}
