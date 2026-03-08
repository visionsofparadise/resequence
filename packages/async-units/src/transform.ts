import { ChunkBuffer } from "./chunk-buffer";
import { AsyncUnit, type AsyncUnitProperties, type AudioChunk, type StreamContext } from "./unit";

export interface TransformAsyncUnitProperties extends AsyncUnitProperties {
	readonly storageThreshold?: number;
	readonly streamChunkSize?: number;
	readonly overlap?: number;
}

export abstract class TransformAsyncUnit extends AsyncUnit {
	declare readonly properties: TransformAsyncUnitProperties;

	private chunkBuffer?: ChunkBuffer;
	private bufferOffset = 0;
	private streamContext?: StreamContext;
	private inferredChunkSize?: number;

	static override is(value: unknown): value is TransformAsyncUnit {
		return AsyncUnit.is(value) && value.type[1] === "transform";
	}

	get overlap(): number {
		return this.properties.overlap ?? 0;
	}

	private get outputChunkSize(): number {
		return this.properties.streamChunkSize ?? this.inferredChunkSize ?? 44100;
	}

	protected override _setup(context: StreamContext): void {
		this.streamContext = context;
	}

	_buffer(_chunk: AudioChunk): Promise<void> | void {
		return;
	}

	_process(_buffer: ChunkBuffer): Promise<void> | void {
		return;
	}

	_unbuffer(chunk: AudioChunk): Promise<AudioChunk> | AudioChunk {
		return chunk;
	}

	createTransform(): TransformStream<AudioChunk, AudioChunk> {
		return new TransformStream<AudioChunk, AudioChunk>({
			transform: (chunk, controller) => this.handleTransform(chunk, controller),
			flush: (controller) => this.handleFlush(controller),
		});
	}

	private async handleTransform(
		chunk: AudioChunk,
		controller: TransformStreamDefaultController<AudioChunk>,
	): Promise<void> {
		this.inferredChunkSize ??= chunk.duration;

		const channels = this.streamContext?.channels ?? chunk.samples.length;

		this.chunkBuffer ??= new ChunkBuffer(
			this.bufferSize,
			channels,
			this.properties.storageThreshold,
		);

		// Let subclass observe the chunk
		await this._buffer(chunk);

		// Append to buffer
		await this.chunkBuffer.append(chunk.samples);

		// For bufferSize=0, immediately unbuffer each chunk
		if (this.bufferSize === 0) {
			await this.emitBuffer(controller);
			return;
		}

		// Emit when buffer reaches bufferSize
		if (this.bufferSize !== Infinity && this.chunkBuffer.frames >= this.bufferSize) {
			await this.processAndEmit(controller);
		}
	}

	private async handleFlush(controller: TransformStreamDefaultController<AudioChunk>): Promise<void> {
		if (!this.chunkBuffer || this.chunkBuffer.frames === 0) return;

		if (this.bufferSize === 0) {
			// Already emitted everything in handleTransform
			await this.chunkBuffer.close();
			return;
		}

		await this.processAndEmit(controller);
		await this.chunkBuffer.close();
		this.chunkBuffer = undefined;
	}

	private async processAndEmit(controller: TransformStreamDefaultController<AudioChunk>): Promise<void> {
		if (!this.chunkBuffer) return;

		// Run _process if subclass defines meaningful work
		await this._process(this.chunkBuffer);

		// Emit buffer contents through _unbuffer
		await this.emitBuffer(controller);
	}

	private async emitBuffer(controller: TransformStreamDefaultController<AudioChunk>): Promise<void> {
		if (!this.chunkBuffer) return;

		const chunkSize = this.bufferSize === 0
			? this.chunkBuffer.frames
			: Math.min(
				this.bufferSize === Infinity ? Infinity : this.bufferSize,
				this.outputChunkSize,
			);

		const emitSize = chunkSize === Infinity ? this.outputChunkSize : chunkSize;

		for await (const chunk of this.chunkBuffer.iterate(emitSize)) {
			const adjusted: AudioChunk = {
				samples: chunk.samples,
				offset: this.bufferOffset + chunk.offset,
				duration: chunk.duration,
			};

			const result = await this._unbuffer(adjusted);
			controller.enqueue(result);
		}

		this.bufferOffset += this.chunkBuffer.frames;

		// Keep overlap frames for next cycle
		if (this.overlap > 0 && this.bufferSize !== Infinity) {
			const overlapStart = this.chunkBuffer.frames - this.overlap;

			if (overlapStart > 0) {
				const overlapChunk = await this.chunkBuffer.read(overlapStart, this.overlap);
				const channels = this.streamContext?.channels ?? this.chunkBuffer.channels;

				await this.chunkBuffer.close();
				this.chunkBuffer = new ChunkBuffer(
					this.bufferSize,
					channels,
					this.properties.storageThreshold,
				);

				await this.chunkBuffer.append(overlapChunk.samples);
				this.bufferOffset -= this.overlap;
			}
		} else if (this.bufferSize !== 0) {
			// Reset buffer for next cycle (not needed for bufferSize=0, handled per-chunk)
			const channels = this.streamContext?.channels ?? this.chunkBuffer.channels;
			await this.chunkBuffer.close();
			this.chunkBuffer = new ChunkBuffer(
				this.bufferSize,
				channels,
				this.properties.storageThreshold,
			);
		}
	}
}
