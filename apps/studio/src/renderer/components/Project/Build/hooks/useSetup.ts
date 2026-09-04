import { useEffect, useState } from "react";
import { type Router, Playback } from "resequence";
import { ValueScheduler } from "../models/ValueScheduler";
import { type DerivedDriverMap, hijackDrivers } from "../utils/hijackDrivers";
import type { MainWithEvents } from "../../../../models/Main";

export interface SetupResult {
	readonly audioContext: AudioContext;
	readonly playbackEngine: Playback;
	readonly unitDriverMap: DerivedDriverMap;
}

export function useSetupPlayback(router: Router, main: MainWithEvents): SetupResult | undefined {
	const [result, setResult] = useState<SetupResult | undefined>();

	useEffect(() => {
		const audioContext = new AudioContext();
		const scheduler = new ValueScheduler(audioContext);
		const playbackEngine = new Playback(router, audioContext);

		let cancelled = false;

		void playbackEngine
			.setup((filePath) => main.readFileBuffer(filePath).then((array) => array.buffer as ArrayBuffer))
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
	}, [router, main]);

	return result;
}
