import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import { Unit } from "../unit";

export class MidSideEffectUnit extends Unit {
	readonly type = "midSide" as const;
	protected readonly innerUnits: ReadonlyArray<Unit> = [];

	private readonly widthValue: number;
	public readonly id?: string;

	constructor(widthValue: number, id?: string) {
		super();
		this.widthValue = widthValue;
		this.id = id;
	}

	protected _setup(context: ScheduleContext): void {
		const splitterNode = context.audioContext.createChannelSplitter(2);
		const mergerNode = context.audioContext.createChannelMerger(2);

		const midGain = context.audioContext.createGain();
		const sideGain = context.audioContext.createGain();

		const midLevel = 1 - this.widthValue;
		const sideLevel = this.widthValue;

		driveParam(midGain.gain, this.id, "mid", midLevel, context, [0, 1]);
		driveParam(sideGain.gain, this.id, "side", sideLevel, context, [0, 1]);

		const midSum = context.audioContext.createGain();
		midSum.gain.value = 0.5;
		splitterNode.connect(midSum, 0);
		splitterNode.connect(midSum, 1);
		midSum.connect(midGain);

		const sideInvert = context.audioContext.createGain();
		sideInvert.gain.value = -1;
		const sideDiff = context.audioContext.createGain();
		sideDiff.gain.value = 0.5;
		splitterNode.connect(sideDiff, 0);
		splitterNode.connect(sideInvert, 1);
		sideInvert.connect(sideDiff);
		sideDiff.connect(sideGain);

		midGain.connect(mergerNode, 0, 0);
		midGain.connect(mergerNode, 0, 1);

		sideGain.connect(mergerNode, 0, 0);

		const sideReinvert = context.audioContext.createGain();
		sideReinvert.gain.value = -1;
		sideGain.connect(sideReinvert);
		sideReinvert.connect(mergerNode, 0, 1);

		this.entryNodes.push(splitterNode);
		this.exitNodes.push(mergerNode);
	}

	protected _teardown(_context: ScheduleContext): void {
		// nodes cleaned up via entryNodes/exitNodes clear in base class
	}
}

export function midSide(value: number, options: { id?: string } = {}): MidSideEffectUnit {
	return new MidSideEffectUnit(value, options.id);
}

export const width = midSide;
export const stereoWidth = midSide;
