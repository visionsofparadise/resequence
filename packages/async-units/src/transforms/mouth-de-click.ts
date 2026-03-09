import { DeClickTransformUnit } from "./de-click";

export function mouthDeClick(options?: {
	sensitivity?: number;
	id?: string;
}): DeClickTransformUnit {
	return new DeClickTransformUnit({
		sensitivity: options?.sensitivity ?? 0.7,
		maxClickDuration: 50,
		id: options?.id,
	});
}
