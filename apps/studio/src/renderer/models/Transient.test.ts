import { beforeAll, describe, expect, it, vi } from "vitest";
import { proxy, subscribe, unstable_enableOp } from "valtio/vanilla";
import { Transient } from "./Transient";

beforeAll(() => {
	unstable_enableOp(true);
});

describe("Transient", () => {
	it("returns initial value", () => {
		const t = new Transient(5);
		expect(t.value).toBe(5);
	});

	it("committed.value= updates _committed, clears transient, and clears isDirty", () => {
		const t = new Transient(0);
		t.transient.value = 99;
		t.committed.value = 42;
		expect(t.value).toBe(42);
		expect(t._committed).toBe(42);
		expect(t.isDirty).toBe(false);
	});

	it("transient.value= updates value without changing _committed, sets isDirty", () => {
		const t = new Transient(0);
		t.transient.value = 99;
		expect(t.value).toBe(99);
		expect(t._committed).toBe(0);
		expect(t.isDirty).toBe(true);
	});

	it("toJson returns _committed, not transient value", () => {
		const t = new Transient(0);
		t.transient.value = 99;
		expect(t.toJson()).toBe(0);
	});

	it("clamping applies min/max to committed", () => {
		const t = new Transient(0.5, { minimum: 0, maximum: 1 });
		t.committed.value = 2;
		expect(t.value).toBe(1);
		t.committed.value = -1;
		expect(t.value).toBe(0);
	});

	it("transient updates inside a valtio proxy generate at most one op (isDirty flip)", () => {
		const state = proxy({ knob: new Transient(0) });
		const captured: unknown[] = [];
		const unsub = subscribe(state, (ops) => captured.push(...ops), true);
		// First transient update flips isDirty: false → true (one op)
		state.knob.transient.value = 0.3;
		const afterFirst = captured.length;
		// Subsequent updates don't generate more ops (isDirty stays true)
		state.knob.transient.value = 0.5;
		state.knob.transient.value = 0.7;
		unsub();
		expect(captured.length).toBe(afterFirst);
	});

	it("committed updates inside a valtio proxy generate ops", () => {
		const state = proxy({ knob: new Transient(0) });
		const captured: unknown[] = [];
		const unsub = subscribe(state, (ops) => captured.push(...ops), true);
		state.knob.committed.value = 0.5;
		unsub();
		expect(captured.length).toBeGreaterThan(0);
	});

	it("watch calls listener immediately with current value", () => {
		const t = new Transient(5);
		const listener = vi.fn();
		t.watch(listener);
		expect(listener).toHaveBeenCalledOnce();
		expect(listener).toHaveBeenCalledWith(5);
	});

	it("watch notifies on both committed and transient changes", () => {
		const t = new Transient(0);
		const listener = vi.fn();
		t.watch(listener);
		listener.mockClear(); // clear the immediate call
		t.committed.value = 1;
		t.transient.value = 2;
		expect(listener).toHaveBeenCalledTimes(2);
	});

	it("watch returns unsubscribe that stops notifications", () => {
		const t = new Transient(0);
		const listener = vi.fn();
		const unsub = t.watch(listener);
		unsub();
		t.committed.value = 1;
		expect(listener).toHaveBeenCalledOnce(); // only the immediate call
	});

	it("reset restores default value", () => {
		const t = new Transient(5, { default: 5 });
		t.committed.value = 10;
		t.reset();
		expect(t.value).toBe(5);
	});
});
