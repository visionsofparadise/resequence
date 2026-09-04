import { useCreateState } from "../ProxyStore/hooks/useCreateState";
import type { State } from ".";
import type { ProxyStore } from "../ProxyStore/ProxyStore";

export interface AppState extends State {
	x: number;
	y: number;
	width: number;
	height: number;
	maximized: boolean;
}

export function useAppState(store: ProxyStore) {
	return useCreateState<AppState>({ x: 0, y: 0, width: 1200, height: 800, maximized: false }, store);
}
