import { useEffect, useState } from "react";
import { type Pattern, Playback } from "resequence";
import type { MainWithEvents } from "../../../../models/Main";
import { ValueScheduler } from "../models/ValueScheduler";
import { type DerivedDriverMap, hijackDrivers } from "../utils/hijackDrivers";

export interface SetupResult {
	readonly audioContext: AudioContext;
	readonly playbackEngine: Playback;
	readonly unitDriverMap: DerivedDriverMap;
}

export function useSetupPlayback(rootPattern: Pattern, main: MainWithEvents): SetupResult | undefined {
	const [result, setResult] = useState<SetupResult | undefined>();

	useEffect(() => {
		const audioContext = new AudioContext();
		const scheduler = new ValueScheduler(audioContext);
		const playbackEngine = new Playback(rootPattern, audioContext);

		let cancelled = false;

		void playbackEngine
			.setup((filePath) => main.readFileBuffer(filePath).then((arr) => arr.buffer as ArrayBuffer))
			.then(() => {
				if (cancelled || !playbackEngine.context) return;

				const unitDriverMap = hijackDrivers(playbackEngine.context.driverMap, scheduler);

				setResult({ audioContext, playbackEngine, unitDriverMap });
			});

		return () => {
			cancelled = true;
			playbackEngine.stop();
			scheduler.stop();

			void audioContext.close();
		};
	}, [rootPattern, main]);

	return result;
}
