import type { State } from ".";
import { useCreateState } from "../ProxyStore/hooks/useCreateState";
import type { ProxyStore } from "../ProxyStore/ProxyStore";

export interface PlaybackState extends State {
	beat: number;
	playing: boolean;
	loop: boolean;
}

export function usePlaybackState(store: ProxyStore) {
	return useCreateState<PlaybackState>({ beat: 0, playing: false, loop: false }, store);
}
