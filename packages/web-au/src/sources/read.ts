import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";
import { z } from "zod";

export class ReadUnit extends Unit {
	readonly type = ["unit", "source", "read"] as const;

	static override is(value: unknown): value is ReadUnit {
		return Unit.is(value) && value.type[1] === "source" && value.type[2] === "read";
	}

	readonly path: string;
	private sourceNode: AudioBufferSourceNode | undefined;
	private buffer: AudioBuffer | undefined;

	constructor(input: { path: string } & UnitInput) {
		super(input, z.object({}));
		this.path = input.path;
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		this.buffer = await context.getSample(this.path);
		this.duration = this.buffer.duration;

		const gainNode = context.audioContext.createGain();

		this.sourceNode = context.audioContext.createBufferSource();
		this.sourceNode.buffer = this.buffer;
		this.sourceNode.connect(gainNode);

		return { entries: [gainNode], exits: [gainNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.sourceNode = undefined;
		this.buffer = undefined;
	}

	start(context: UnitContext): void {
		if (this.sourceNode) {
			const latencyOffset = context.latencyBudget > 0 ? context.latencyBudget / context.audioContext.sampleRate : 0;

			this.sourceNode.start(latencyOffset);
		}
	}
}

export function read({ path, id }: { path: string; id?: string }): ReadUnit {
	return new ReadUnit({ path, id });
}
