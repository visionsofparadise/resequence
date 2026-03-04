import type { INTERNAL_Op } from "valtio/vanilla";
import { proxy, ref } from "valtio/vanilla";
import type { State } from ".";
import type { ProxyStore } from "../ProxyStore/ProxyStore";
import { useCreateState } from "../ProxyStore/hooks/useCreateState";

type ValtioOp = INTERNAL_Op;

export interface MutateOptions {
	history?: HistoryState;
	transactionKey?: string;
	label?: string;
}

interface HistoryEntry {
	ops: Array<ValtioOp>;
	proxy: object;
}

function applyOp(targetProxy: object, op: ValtioOp, reverse: boolean): void {
	const path = op[1] as Array<string | symbol>;
	let target = targetProxy as Record<string | symbol, unknown>;

	for (const segment of path.slice(0, -1)) {
		target = target[segment] as Record<string | symbol, unknown>;
	}

	const key = path[path.length - 1];
	if (key === undefined) return;

	if (op[0] === "set") {
		target[key] = reverse ? op[3] : op[2];
	} else {
		if (reverse) {
			target[key] = op[2];
		} else {
			Reflect.deleteProperty(target, key);
		}
	}
}

export interface HistoryState extends State {
	readonly canUndo: boolean;
	readonly canRedo: boolean;
	record(targetProxy: object, ops: Array<ValtioOp>, options?: MutateOptions): void;
	undo(): void;
	redo(): void;
}

export function useHistoryState(store: ProxyStore): HistoryState {
	const history = proxy({
		_index: -1,
		_stack: ref<Array<string>>([]),
		_entries: ref(new Map<string, HistoryEntry>()),

		get canUndo(): boolean {
			return this._index >= 0;
		},

		get canRedo(): boolean {
			return this._index < this._stack.length - 1;
		},

		record(targetProxy: object, ops: Array<ValtioOp>, options?: MutateOptions): void {
			if (ops.length === 0) return;

			const key = options?.transactionKey ?? crypto.randomUUID();

			if (options?.transactionKey && this._stack[this._index] === options.transactionKey) {
				this._entries.get(key)?.ops.push(...ops);
			} else {
				const removed = this._stack.splice(this._index + 1);
				for (const removedKey of removed) this._entries.delete(removedKey);

				this._stack.push(key);
				this._index = this._stack.length - 1;
				this._entries.set(key, { ops: [...ops], proxy: targetProxy });
			}
		},

		undo(): void {
			if (this._index < 0) return;

			const stackKey = this._stack[this._index];
			if (stackKey === undefined) return;

			const entry = this._entries.get(stackKey);

			if (entry) {
				for (const op of entry.ops.slice().reverse()) {
					applyOp(entry.proxy, op, true);
				}
			}

			this._index--;
		},

		redo(): void {
			if (this._index >= this._stack.length - 1) return;

			this._index++;
			const stackKey = this._stack[this._index];
			if (stackKey === undefined) return;

			const entry = this._entries.get(stackKey);

			if (entry) {
				for (const op of entry.ops) {
					applyOp(entry.proxy, op, false);
				}
			}
		},
	});

	return useCreateState<HistoryState>(history, store);
}
