import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";

import { Unit } from "@resequence/web-au-core";

export interface ReadProperties extends UnitProperties {
	readonly path: string;
	readonly previousProperties?: ReadProperties;
}

export class ReadUnit extends Unit {
	readonly type = ["unit", "source", "read"] as const;

	static override is(value: unknown): value is ReadUnit {
		return Unit.is(value) && value.type[1] === "source" && value.type[2] === "read";
	}

	declare readonly properties: ReadProperties;
	private sourceNode: AudioBufferSourceNode | undefined;
	private buffer: AudioBuffer | undefined;

	constructor(properties: UnitInput<ReadProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get path(): string {
		return this.properties.path;
	}

	get duration(): number {
		return this.buffer?.duration ?? 0;
	}

	clone(overrides?: Partial<ReadProperties>): ReadUnit {
		return new ReadUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		this.buffer = await context.getSample(this.path);

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
