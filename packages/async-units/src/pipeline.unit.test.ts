import { describe, it, expect } from "vitest";
import { read } from "./sources/read";
import { write } from "./targets/write";
import { gain } from "./transforms/gain";
import { chain } from "./composites/chain";
import { join } from "node:path";
import { writeFile, unlink, readFile, mkdir, rmdir } from "node:fs/promises";
import { WaveFile } from "wavefile";

const testDir = join(import.meta.dirname, "__test_fixtures__");

function createTestWav(sampleRate: number, channels: number, samples: Array<Float32Array>): Buffer {
	const wav = new WaveFile();
	wav.fromScratch(channels, sampleRate, "32f", samples);
	wav.toBitDepth("16");
	return Buffer.from(wav.toBuffer());
}

describe("Pipeline integration", () => {
	const inputPath = join(testDir, "test-input.wav");
	const outputPath = join(testDir, "test-output.wav");

	it("read → gain → write pipeline produces correct output", async () => {
		const sampleRate = 44100;
		const frames = 1000;
		const samples = new Float32Array(frames);
		for (let index = 0; index < frames; index++) {
			samples[index] = Math.sin(2 * Math.PI * 440 * index / sampleRate);
		}

		const wavBuffer = createTestWav(sampleRate, 1, [samples]);

		await mkdir(testDir, { recursive: true });
		await writeFile(inputPath, wavBuffer);

		try {
			const pipeline = chain(
				read(inputPath),
				gain({ level: 0.5 }),
				write(outputPath),
			);
			await pipeline.render();

			// Read back the output
			const outputData = await readFile(outputPath);
			const outputWav = new WaveFile(new Uint8Array(outputData.buffer, outputData.byteOffset, outputData.byteLength));
			outputWav.toBitDepth("32f");
			const rawOutput = outputWav.getSamples(false, Float64Array) as unknown;
			const outputSamples = new Float32Array(rawOutput as Float64Array);
			const fmt = outputWav.fmt as { sampleRate: number };

			expect(fmt.sampleRate).toBe(sampleRate);
			expect(outputSamples.length).toBe(frames);

			// Verify gain was applied: output should be ~half of input
			for (let index = 0; index < frames; index++) {
				const expected = Math.sin(2 * Math.PI * 440 * index / sampleRate) * 0.5;
				const actual = outputSamples[index] ?? 0;
				// 16-bit quantization allows some error
				expect(Math.abs(actual - expected)).toBeLessThan(0.01);
			}
		} finally {
			await unlink(inputPath).catch(() => undefined);
			await unlink(outputPath).catch(() => undefined);
			await rmdir(testDir).catch(() => undefined);
		}
	});
});
