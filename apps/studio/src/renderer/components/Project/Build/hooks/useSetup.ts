import { useEffect, useState } from "react";
import { type PatternSource, Playback } from "resequence";
import type { MainWithEvents } from "../../../../models/Main";
import { ValueScheduler } from "../models/ValueScheduler";
import { type DerivedDriverMap, hijackDrivers } from "../utils/hijackDrivers";

export interface SetupResult {
	readonly audioContext: AudioContext;
	readonly playbackEngine: Playback;
	readonly unitDriverMap: DerivedDriverMap;
}

export function useSetupPlayback(source: PatternSource, main: MainWithEvents): SetupResult | undefined {
	const [result, setResult] = useState<SetupResult | undefined>();

	useEffect(() => {
		const audioContext = new AudioContext();
		const scheduler = new ValueScheduler(audioContext);
		const playbackEngine = new Playback(source, audioContext);

		let cancelled = false;

		void playbackEngine
			.setup((filePath) => main.readFileBuffer(filePath).then((arr) => arr.buffer as ArrayBuffer))
			.then(() => {
				if (cancelled) return;

				const unitDriverMap = hijackDrivers(playbackEngine.drivers, scheduler);

				setResult({ audioContext, playbackEngine, unitDriverMap });
			});

		return () => {
			cancelled = true;
			playbackEngine.stop();
			scheduler.stop();

			void audioContext.close();
		};
	}, [source, main]);

	return result;
}
