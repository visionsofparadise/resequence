import type { PositionedMetadata } from "../patterns/pattern";

export interface TimeSignaturePoint {
	readonly beat: number;
	readonly timeSignature: readonly [number, number];
}

export function collectTimeSignatures(metadatas: ReadonlyArray<PositionedMetadata>, offsetBeats = 0): ReadonlyArray<TimeSignaturePoint> {
	return metadatas
		.filter((positioned): positioned is typeof positioned & { meta: { timeSignature: readonly [number, number] } } => positioned.meta.timeSignature !== undefined)
		.map((positioned) => ({ beat: positioned.beat + offsetBeats, timeSignature: positioned.meta.timeSignature }))
		.sort((left, right) => left.beat - right.beat);
}
