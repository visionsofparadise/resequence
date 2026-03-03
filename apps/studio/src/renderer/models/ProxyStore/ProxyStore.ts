import type { INTERNAL_Op } from "valtio/vanilla";
import { subscribe, unstable_enableOp } from "valtio/vanilla";
import type { MutateOptions } from "../State/History";

type ValtioOp = INTERNAL_Op;

unstable_enableOp(true);

export class ProxyStore {
	private readonly _map = new Map<symbol, object>();

	dangerouslyGetProxy<T extends object>(key: symbol): T | undefined {
		return this._map.get(key) as T | undefined;
	}

	dangerouslySetProxy(key: symbol, value: object): void {
		this._map.set(key, value);
	}

	mutate<T extends { _key: symbol }>(state: T, callback: (proxy: T) => void, options?: MutateOptions): void {
		const proxy = this._map.get(state._key);

		if (!proxy) return;

		if (!options?.history) {
			callback(proxy as T);

			return;
		}

		const capturedOps: Array<ValtioOp> = [];
		const unsubscribe = subscribe(proxy, (ops) => capturedOps.push(...ops), true);

		callback(proxy as T);
		unsubscribe();

		options.history.record(proxy, capturedOps, options);
	}
}
