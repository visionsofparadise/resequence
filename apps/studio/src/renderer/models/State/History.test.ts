import { proxy } from "valtio/vanilla";
import { describe, expect, it } from "vitest";
import { ProxyStore } from "../ProxyStore/ProxyStore";
import { useCreateHistoryState } from "./History";

const makeState = <T extends object>(store: ProxyStore, initial: T) => {
	const _key = Symbol();
	const pp = proxy({ ...initial, _key });
	store.dangerouslySetProxy(_key, pp);
	return pp;
};

describe("history", () => {
	it("undo reverts a mutation", () => {
		const history = useCreateHistoryState();
		const store = new ProxyStore();
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

	it("redo re-applies after undo", () => {
		const history = useCreateHistoryState();
		const store = new ProxyStore();
		const state = makeState(store, { value: 0 });

		store.mutate(
			state,
			(st) => {
				st.value = 20;
			},
			{ history },
		);
		history.undo();
		history.redo();
		expect(state.value).toBe(20);
	});

	it("transaction grouping merges ops into single undo step", () => {
		const history = useCreateHistoryState();
		const store = new ProxyStore();
		const state = makeState(store, { aa: 0, bb: 0 });

		const txKey = "tx-group";
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

	it("new action after undo truncates future stack", () => {
		const history = useCreateHistoryState();
		const store = new ProxyStore();
		const state = makeState(store, { value: 0 });

		store.mutate(
			state,
			(st) => {
				st.value = 1;
			},
			{ history },
		);
		store.mutate(
			state,
			(st) => {
				st.value = 2;
			},
			{ history },
		);
		history.undo();
		store.mutate(
			state,
			(st) => {
				st.value = 99;
			},
			{ history },
		);
		history.redo();
		expect(state.value).toBe(99);
	});

	it("history.canUndo reflects undo availability", () => {
		const history = useCreateHistoryState();
		const store = new ProxyStore();
		const state = makeState(store, { xx: 0 });

		store.mutate(
			state,
			(st) => {
				st.xx = 5;
			},
			{ history },
		);
		expect(history.canUndo).toBe(true);
		while (history.canUndo) history.undo();
		expect(history.canUndo).toBe(false);
	});

	it("undo on empty stack is a no-op", () => {
		const history = useCreateHistoryState();
		expect(() => history.undo()).not.toThrow();
	});

	it("redo on exhausted stack is a no-op", () => {
		const history = useCreateHistoryState();
		expect(() => history.redo()).not.toThrow();
	});
});
