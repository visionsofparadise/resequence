import { unitColors } from "@resequence/design-system";

export function createPortColorMap(portKeys: Array<string>): Map<string, string> {
	const map = new Map<string, string>();

	portKeys.forEach((key, index) => {
		const color = unitColors[index % unitColors.length];

		if (color) map.set(key, color);
	});

	return map;
}
