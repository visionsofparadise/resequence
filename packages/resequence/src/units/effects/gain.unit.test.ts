import { describe, expect, it } from "vitest";
import type { ScheduleContext } from "../../rendering/schedule-context";
import { GainEffectUnit, gain } from "./gain";
import { pan } from "./pan";

function createMockContext(): ScheduleContext {
	const connections: Array<{ from: string; to: string }> = [];

	const createParam = (name: string): AudioParam =>
		({ value: 0, setValueAtTime: () => undefined, cancelScheduledValues: () => undefined, linearRampToValueAtTime: () => undefined, _name: name }) as unknown as AudioParam;

	const createNode = (name: string): AudioNode & { gain: AudioParam; offset: AudioParam } => ({
		gain: createParam(`${name}.gain`),
		offset: createParam(`${name}.offset`),
		connect: (dest: AudioNode | AudioParam) => {
			connections.push({ from: name, to: (dest as unknown as { _name?: string })._name ?? "node" });
			return dest;
		},
		disconnect: () => undefined,
		addEventListener: () => undefined,
		_name: name,
	}) as unknown as AudioNode & { gain: AudioParam; offset: AudioParam };

	let nodeCount = 0;

	return {
		audioContext: {
			createGain: () => createNode(`gain-${nodeCount++}`),
			createConstantSource: () => {
				const node = createNode(`constant-${nodeCount++}`);
				return { ...node, start: () => undefined, stop: () => undefined };
			},
			destination: createNode("destination"),
		},
		sampleMap: new Map(),
		driverMap: new Map(),
		tempoMap: [],
		fromBeats: 0,
		toBeats: Infinity,
		_connections: connections,
	} as unknown as ScheduleContext & { _connections: typeof connections };
}

describe("gain", () => {
	it("creates a GainEffectUnit instance", () => {
		const fx = gain({ level: -3 });
		expect(fx).toBeInstanceOf(GainEffectUnit);
		expect(fx.type).toBe("gain");
	});

	it("accepts optional id", () => {
		const fx = gain({ level: -3, id: "vol" });
		expect(fx.id).toBe("vol");
	});

	it("to() returns void", () => {
		const fx = gain({ level: -3 });
		const next = gain({ level: -6 });
		const result = fx.to(next);
		expect(result).toBeUndefined();
	});

	it("to() appends to outputs of the source node", () => {
		const original = gain({ level: -3 });
		const p = pan({ position: 0 });
		original.to(p);
		expect(original.targets).toHaveLength(1);
		expect(original.targets[0]).toBe(p);
	});

	it("chains multiple effects serially", () => {
		const g = gain({ level: -3 });
		const p = pan({ position: 0.5 });
		g.to(p);
		expect(g.targets).toHaveLength(1);
		expect(g.targets[0]).toBe(p);
	});
});

describe("mod", () => {
	it("does not affect targets", () => {
		const g = gain({ level: 1 });
		g.mod(["filter.frequency"]);
		expect(g.targets).toHaveLength(0);
	});

	it("connects exit nodes to driver offset on setup", () => {
		const g = gain({ level: 1, id: "lfo-gain" });
		const target = gain({ level: 1, id: "target" });
		g.mod(["target.level"]);
		g.to(target);

		const ctx = createMockContext();
		g.setup(ctx);

		expect(ctx.driverMap.has("target.level")).toBe(true);
	});

	it("creates driver for mod path even if target unit has no id", () => {
		const g = gain({ level: 1, id: "source" });
		g.mod(["some.param"]);

		const ctx = createMockContext();
		g.setup(ctx);

		expect(ctx.driverMap.has("some.param")).toBe(true);
	});
});
