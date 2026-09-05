import { live } from "@resequence/web-au-core";
import { z } from "zod";

export const rateDepthSchema = z.object({
	rate: live(z.number().min(0.01).max(100).default(1).describe("Rate (Hz)")),
	depth: live(z.number().min(0).max(1).default(0.5).describe("Depth")),
});
