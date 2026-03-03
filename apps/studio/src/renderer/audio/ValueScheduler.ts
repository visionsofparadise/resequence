import type { StudioDriver } from "./StudioDriver";

type SegmentType = "setValueAtTime" | "linearRamp" | "exponentialRamp";

interface AutomationSegment {
	readonly type: SegmentType;
	readonly value: number;
	readonly time: number;
}

export class ValueScheduler {
	private readonly segments = new Map<StudioDriver, Array<AutomationSegment>>();
	private rafId: number | null = null;

	constructor(private readonly audioContext: BaseAudioContext) {}

	schedule(driver: StudioDriver, type: SegmentType, value: number, time: number): void {
		let list = this.segments.get(driver);

		if (!list) {
			list = [];
			this.segments.set(driver, list);
		}

		list.push({ type, value, time });
		this.ensureRunning();
	}

	cancel(driver: StudioDriver, startTime: number): void {
		const list = this.segments.get(driver);

		if (!list) return;

		const filtered = list.filter((seg) => seg.time < startTime);

		if (filtered.length === 0) {
			this.segments.delete(driver);
		} else {
			this.segments.set(driver, filtered);
		}
	}

	stop(): void {
		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId);

			this.rafId = null;
		}

		this.segments.clear();
	}

	private ensureRunning(): void {
		if (this.rafId !== null) return;

		this.rafId = requestAnimationFrame(() => this.tick());
	}

	private tick(): void {
		this.rafId = null;

		const currentTime = this.audioContext.currentTime;

		for (const [driver, list] of this.segments) {
			const value = this.interpolate(list, currentTime);

			if (value !== undefined) driver.mirror(value);

			while (list.length > 0 && list[0] && list[0].time <= currentTime) {
				if (list.length === 1) break;

				list.shift();
			}

			if (list.length <= 1 && list[0] && list[0].time <= currentTime) {
				this.segments.delete(driver);
			}
		}

		if (this.segments.size > 0) {
			this.rafId = requestAnimationFrame(() => this.tick());
		}
	}

	private interpolate(segments: ReadonlyArray<AutomationSegment>, currentTime: number): number | undefined {
		if (segments.length === 0) return undefined;

		let prevValue = segments[0]?.value ?? 0;
		let prevTime = segments[0]?.time ?? 0;

		for (const seg of segments) {
			if (seg.time > currentTime) {
				switch (seg.type) {
					case "setValueAtTime":
						return prevValue;
					case "linearRamp": {
						const duration = seg.time - prevTime;

						if (duration <= 0) return seg.value;

						const progress = (currentTime - prevTime) / duration;

						return prevValue + (seg.value - prevValue) * Math.min(1, Math.max(0, progress));
					}
					case "exponentialRamp": {
						const duration = seg.time - prevTime;

						if (duration <= 0) return seg.value;

						const progress = (currentTime - prevTime) / duration;
						const clampedProgress = Math.min(1, Math.max(0, progress));

						if (prevValue <= 0 || seg.value <= 0) {
							return prevValue + (seg.value - prevValue) * clampedProgress;
						}

						return prevValue * (seg.value / prevValue) ** clampedProgress;
					}
				}
			}

			prevValue = seg.value;
			prevTime = seg.time;
		}

		return prevValue;
	}
}
