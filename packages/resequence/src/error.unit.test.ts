import { describe, expect, it } from "vitest";
import { ResequenceError } from "./error";

describe("ResequenceError", () => {
	it("instantiates with code and message", () => {
		const error = new ResequenceError("TEST_CODE", "test message");
		expect(error.code).toBe("TEST_CODE");
		expect(error.message).toBe("test message");
		expect(error.name).toBe("ResequenceError");
	});

	it("is instanceof Error", () => {
		const error = new ResequenceError("TEST_CODE", "test message");
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(ResequenceError);
	});
});
