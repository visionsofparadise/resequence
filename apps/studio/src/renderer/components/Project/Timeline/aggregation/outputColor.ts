function djb2(input: string): number {
	let hash = 5381;
	for (let ci = 0; ci < input.length; ci++) {
		hash = ((hash << 5) + hash + input.charCodeAt(ci)) | 0;
	}
	return Math.abs(hash);
}

export function outputColor(outputId: string): string {
	const hue = djb2(outputId) % 360;
	return `hsl(${hue}, 65%, 55%)`;
}

export function outputSetColor(outputIds: ReadonlyArray<string>): string {
	if (outputIds.length === 0) return "hsl(0, 0%, 45%)";

	const first = outputIds[0];
	if (outputIds.length === 1 && first !== undefined) return outputColor(first);

	let hueSum = 0;
	for (const id of outputIds) {
		hueSum += djb2(id) % 360;
	}
	const avgHue = Math.round(hueSum / outputIds.length);
	return `hsl(${avgHue}, 65%, 55%)`;
}
