import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";
import { z } from "zod";

export class AnalyserUnit extends Unit {
	readonly type = ["unit", "analyser"] as const;

	static override is(value: unknown): value is AnalyserUnit {
		return Unit.is(value) && value.type[1] === "analyser";
	}

	readonly fftSize: number;
	public analyserNode: AnalyserNode | undefined;

	constructor(input: { fftSize: number } & UnitInput) {
		super(input, z.object({}));
		this.fftSize = input.fftSize;
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
