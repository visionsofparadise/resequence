import { DeClickTransformUnit } from "./de-click";

export function deCrackle(options?: {
	sensitivity?: number;
	id?: string;
}): DeClickTransformUnit {
	return new DeClickTransformUnit({
		sensitivity: options?.sensitivity ?? 0.5,
		maxClickDuration: 20,
		id: options?.id,
	});
}
