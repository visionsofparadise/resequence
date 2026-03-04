import { proxy } from "valtio/vanilla";
import { describe, expect, it } from "vitest";
import { useHistoryState } from "../State/History";
import { ProxyStore } from "./ProxyStore";

const makeState = <T extends object>(store: ProxyStore, initial: T) => {
	const _key = Symbol();
	const pp = proxy({ ...initial, _key });
	store.dangerouslySetProxy(_key, pp);
	return pp;
};

describe("ProxyStore", () => {
	it("mutate updates state", () => {
		const store = new ProxyStore();
		const state = makeState(store, { value: 0 });

		store.mutate(state, (st) => {
			st.value = 42;
		});
		expect(state.value).toBe(42);
	});

	it("mutate without history does not record to undo stack", () => {
		const store = new ProxyStore();
		const history = useHistoryState(store);
		const state = makeState(store, { value: 0 });

		store.mutate(state, (st) => {
			st.value = 5;
		});
		expect(history.canUndo).toBe(false);
	});

	it("mutate with history allows undo", () => {
		const store = new ProxyStore();
		const history = useHistoryState(store);
		const state = makeState(store, { value: 0 });

		store.mutate(
			state,
			(st) => {
				st.value = 10;
			},
			{ history },
		);
		expect(state.value).toBe(10);
		history.undo();
		expect(state.value).toBe(0);
	});

	it("mutate with transactionKey merges into single undo step", () => {
		const store = new ProxyStore();
		const history = useHistoryState(store);
		const state = makeState(store, { aa: 0, bb: 0 });

		const txKey = "tx";
		store.mutate(
			state,
			(st) => {
				st.aa = 1;
			},
			{ history, transactionKey: txKey },
		);
		store.mutate(
			state,
			(st) => {
				st.bb = 2;
			},
			{ history, transactionKey: txKey },
		);
		history.undo();
		expect(state.aa).toBe(0);
		expect(state.bb).toBe(0);
	});
});
