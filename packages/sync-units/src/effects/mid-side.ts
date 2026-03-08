import type { Fan } from "../composites/fan";
import { fan } from "../composites/fan";
import { mid } from "./channel";
import { side } from "./channel";
import { linearGain } from "./gain";

export function midSide(value: number, options: { id?: string } = {}): Fan {
	const { id } = options;

	const midLevel = 1 - value;
	const sideLevel = value;

	return fan(
		mid(linearGain({ level: midLevel, id: id ? `${id}.mid` : undefined })),
		side(linearGain({ level: sideLevel, id: id ? `${id}.side` : undefined })),
	);
}

export const width = midSide;
export const stereoWidth = midSide;
