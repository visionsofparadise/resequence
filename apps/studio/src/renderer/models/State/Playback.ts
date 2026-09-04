import { useCreateState } from "../ProxyStore/hooks/useCreateState";
import { Transient } from "../Transient";
import type { State } from ".";
import type { ProxyStore } from "../ProxyStore/ProxyStore";

export interface PlaybackState extends State {
	beat: Transient<number>;
	playing: boolean;
	loop: boolean;
}

export function usePlaybackState(store: ProxyStore) {
	return useCreateState<PlaybackState>({ beat: new Transient(0), playing: false, loop: false }, store);
}
