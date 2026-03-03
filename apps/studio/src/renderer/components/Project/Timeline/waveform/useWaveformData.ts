import { useQuery } from "@tanstack/react-query";
import { resolve } from "pathe";
import type { ProjectContext } from "../../../../models/Context";
import { parseWaveformBinary, type WaveformBinary } from "../../../../../shared/utilities/waveform/WaveformCodec";

export function useWaveformData(filePath: string, context: ProjectContext): { data: WaveformBinary | undefined; isLoading: boolean; error: Error | null } {
	const absolutePath = resolve(context.currentProjectPath, filePath);

	const { data, isLoading, error } = useQuery<WaveformBinary>({
		queryKey: ["waveform", absolutePath],
		queryFn: async () => {
			const result = await context.main.generateWaveform(absolutePath);
			return parseWaveformBinary(result);
		},
		staleTime: Infinity,
	});

	return { data, isLoading, error };
}
