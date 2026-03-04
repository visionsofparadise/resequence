import type { State } from ".";
import { useCreateState } from "../ProxyStore/hooks/useCreateState";
import type { ProxyStore } from "../ProxyStore/ProxyStore";
import { Transient } from "../Transient";

export interface PlaybackState extends State {
	beat: Transient<number>;
	playing: boolean;
	loop: boolean;
}

export function usePlaybackState(store: ProxyStore) {
	return useCreateState<PlaybackState>({ beat: new Transient(0), playing: false, loop: false }, store);
}
