import { describe, expect, it } from "vitest";
import { note } from "./note";
import { sequence } from "./sequence";
import { tuning, TuningPattern } from "./tuning";

describe("TuningPattern", () => {
	it("creates with def", () => {
		const t = tuning(note("C4", "4n"), { equal: 12 });
		expect(t).toBeInstanceOf(TuningPattern);
		expect(t.def).toEqual({ equal: 12 });
		expect(t.type).toBe("tuning");
	});

	it("delegates durationTicks to child", () => {
		const t = tuning(note("C4", "4n"), {});
		expect(t.durationTicks).toBe(480);
	});

	it("delegates sequence duration", () => {
		const t = tuning(sequence(note("C4", "4n"), note("E4", "4n")), {});
		expect(t.durationTicks).toBe(960);
	});

	it("delegates notes to child", () => {
		const t = tuning(note("C4", "4n"), {});
		expect(t.notes).toMatchObject([{ tick: 0, pitch: 60 }]);
	});

	it("passes through any def shape", () => {
		expect(tuning(note("C4", "4n"), null).def).toBeNull();
		expect(tuning(note("C4", "4n"), "just").def).toBe("just");
	});
});
