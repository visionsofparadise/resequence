# @resequence/web-au

Audio processing graph system built on the Web Audio API. Composable units for synthesis, effects, routing, and real-time parameter modulation.

```bash
npm install @resequence/web-au
```

## Overview

Units are the building blocks of audio processing. Each unit declares audio entry and exit nodes and connects to other units via `.to()`. Generators produce sound from note events, effects process audio, and composites wire units into larger structures.

```typescript
import { osc, chain, mix, lowpass, gain, reverb, pan, chorus, envelope, speakers } from "@resequence/web-au";
import { createUnitContext } from "@resequence/web-au/core";
import type { NoteEvent } from "@resequence/web-au/core";

// Build a unit graph
const synth = chain(
	osc({ type: "sawtooth", id: "synth" }),
	envelope({ attack: 10, decay: 200, sustain: 0.6, release: 300 }),
	lowpass({ frequency: 2000, resonance: 4, id: "filt" }),
	mix(chorus({ rate: 0.8, depth: 3 }), 0.3),
	mix(reverb({ roomSize: 0.6, damping: 0.4 }), 0.25),
	gain({ level: -6 }),
	pan({ position: 0.2 }),
	speakers(),
);

// Create a context and set up the graph
const context = createUnitContext(audioContext, getSample, loadModule);

await synth.setup(context);

// Schedule note events
const noteEvent: NoteEvent = {
	startMs: 0,
	stopMs: 500,
	cleanupMs: 1000,
	note: 60,
	velocity: 100,
	bend: 0,
	frequency: 261.63,
};

synth.schedule(noteEvent, context);

// Tear down when done
synth.teardown(context);
```

### Sub-packages

The unit protocol and utilities are split into focused packages. This package re-exports them for convenience:

- `@resequence/web-au-core` — base classes, driver system, graph utilities (also available via `@resequence/web-au/core`)
- `@resequence/web-au-utils` — pitch conversion, MIDI parsing, WAV encoding (also available via `@resequence/web-au/utils`)

## Generators

Generators produce audio from note events. Each note triggers a voice — a per-note source node routed through the generator's processing chain.

### Oscillator

Waveform synthesis. Each voice creates an OscillatorNode tuned to the incoming note.

```typescript
osc({ type: "sawtooth", id: "lead" });
osc({ type: "sine", detune: 7, id: "sub" });
```

Options: `type` (`"sine"`, `"square"`, `"sawtooth"`, `"triangle"`), `detune` (cents), `id`.

Driven parameters: `frequency` [20–20000 Hz], `detune` [-1200–1200 cents].

### Sampler

Sample playback with automatic pitch mapping. Single sample mode transposes via playback rate. Zone mode maps multiple samples across pitch and velocity ranges.

```typescript
// Single sample
sampler("samples/piano-C4.wav", { root: "C4", id: "piano" });

// Multi-zone
sampler(
	[
		{ sample: "samples/piano-C2.wav", root: "C2" },
		{ sample: "samples/piano-C4.wav", root: "C4" },
		{ sample: "samples/piano-C6.wav", root: "C6" },
	],
	{ id: "piano" },
);

// WAV region extraction
sampler("samples/drums.wav#kick", { id: "kick" });
```

Zones support `velocity` layers and `loopStartMs`/`loopEndMs` for sustain loops.

### Noise

White, pink, or brown noise via AudioWorklet. Optional seed for deterministic output.

```typescript
noise({ color: "pink" });
noise({ color: "white", seed: 42 });
```

## Effects

### Filter

BiquadFilter with mode-specific convenience functions.

```typescript
lowpass({ frequency: 800, resonance: 4, id: "lp" });
highpass({ frequency: 200, id: "hp" });
bandpass({ frequency: 1000 });
notch({ frequency: 60 });
peaking({ frequency: 3000, gain: 6 });
lowshelf({ frequency: 200, gain: -3 });
highshelf({ frequency: 8000, gain: 4 });
allpass({ frequency: 1000 });
```

Driven parameters: `frequency` [20–20000 Hz], `resonance` [0–30].

### Gain

```typescript
gain({ level: -6, id: "vol" }); // decibels
linearGain({ level: 0.5 }); // linear 0–2
fader({ level: -3 }); // alias for gain
```

Driven parameter: `level` [0–2].

### Dynamics

```typescript
compressor({ threshold: -24, ratio: 4, attack: 10, release: 100, id: "comp" });
limiter({ threshold: -3 });
```

Driven parameters: `threshold` [-100–0 dB], `ratio` [1–20].

### Delay

Delay with optional feedback loop.

```typescript
delay({ time: 250, feedback: 0.4, id: "dly" });
```

Driven parameter: `time` [0–5000 ms].

### Reverb

Schroeder reverb — 4 parallel comb filters with lowpass feedback into 2 series allpass filters.

```typescript
reverb({ roomSize: 0.7, damping: 0.5, id: "verb" });
```

Driven parameters: `roomSize` [0–1], `damping` [0–1].

### Convolution

Impulse response reverb. Loads a WAV file as the impulse.

```typescript
convolution({ impulse: "ir/hall.wav" });
```

### Chorus / Flanger

Modulated delay with LFO.

```typescript
chorus({ rate: 1.5, depth: 4, feedback: 0.3, id: "chr" });
flanger({ rate: 0.5, depth: 2, feedback: 0.6 });
```

### Phaser

Array of allpass filters with a shared LFO.

```typescript
phaser({ stages: 6, rate: 0.3, depth: 1000 });
```

### Distortion / Waveshaper

```typescript
distortion({ curve: WaveShaperCurve.SoftClip, oversample: "4x" });
waveshaper({ curve: WaveShaperCurve.Fold });
```

Built-in curves: `SoftClip`, `HardClip`, `Fold`, `Saturate`, `Wavefolder`, `HalfRectify`, `FullRectify`.

### Bitcrush / Downsample

AudioWorklet-based effects.

```typescript
bitcrush({ bits: 8, id: "crush" });
downsample({ rate: 8000 });
```

### Ring Mod / AM

```typescript
ringmod(osc({ type: "sine" })); // multiplicative modulation
am(osc({ type: "sine" })); // amplitude modulation with DC offset
```

### EQ

Multi-band parametric EQ — chains filter units in series.

```typescript
eq({
	bands: [
		{ type: "highpass", frequency: 80 },
		{ type: "peaking", frequency: 3000, gain: 3, resonance: 1 },
		{ type: "highshelf", frequency: 10000, gain: -2 },
	],
});
```

### Crossover / Multiband

Frequency band splitting via Linkwitz-Riley filters for per-band processing.

```typescript
crossover({
	low: [300, compressor({ threshold: -20, ratio: 4 })],
	mid: [3000, gain({ level: 2 })],
	high: [gain({ level: -1 })],
});
```

### Stereo

```typescript
pan({ position: -0.5 }); // stereo panner
stereoWidth(0.7); // mid/side width control
midSide(0.5); // alias
left(distortion({ curve: WaveShaperCurve.SoftClip })); // process left channel only
right(reverb({ roomSize: 0.3 })); // process right channel only
mid(compressor({ threshold: -12, ratio: 3 })); // process mid signal
side(chorus({ rate: 0.5, depth: 2 })); // process side signal
spatial({ x: 1, y: 0, z: -2 }); // 3D positioning
```

### Utility

```typescript
mix(reverb({ decay: 2 }), 0.3); // wet/dry blend — 0=dry, 1=wet
```

### De-processing

```typescript
deEss({ frequency: 6500, threshold: -20, ratio: 4 });
deHum({ frequency: 60, harmonics: 4 });
```

## Composites

### Chain

Serial connection. Signal flows through each unit in order.

```typescript
chain(osc({ type: "sawtooth" }), lowpass({ frequency: 1000 }), gain({ level: -6 }), speakers());
```

### Fan

Parallel branches. Input splits to all branches, outputs merge.

```typescript
fan(chain(lowpass({ frequency: 500 }), gain({ level: -3 })), chain(highpass({ frequency: 2000 }), gain({ level: -6 })));
```

### Bypass

Holds a unit but routes signal around it.

```typescript
bypass(reverb({ roomSize: 0.8 }));
```

### Intercept

Wraps a unit to override parameters or insert units before it.

```typescript
intercept(synth, {
	override: { frequency: 0.5 }, // normalized 0–1
	insert: [gain({ level: -3 })],
});
```

## IDs and Parameter Paths

Assigning an `id` to a unit creates a namespace for its parameters. Automation and modulation target parameters via dot-separated paths.

```typescript
const synth = chain(osc({ type: "sawtooth", id: "osc" }), lowpass({ frequency: 2000, id: "lp" }), gain({ level: -6, id: "vol" }));

// Parameter paths:
// "osc.lp.frequency"   — filter cutoff
// "osc.vol.level"      — output gain
```

The generator's ID prefixes downstream effect IDs, giving each parameter a unique address.

## Modulation

### LFO Unit

Continuous parameter modulation in the audio graph.

```typescript
chain(osc({ type: "sawtooth", id: "synth" }), lowpass({ frequency: 1000, id: "filt" }), lfo({ path: "synth.filt.frequency", shape: "sine", rate: 2, depth: 0.5 }));
```

### Macro

Global parameter control. Maps a single value [0–1] to downstream parameters via the driver system.

```typescript
macro(0.5, { id: "intensity" });
```

### Envelope

ADSR envelope generator via AudioWorklet. Applied per voice.

```typescript
envelope({ attack: 10, hold: 0, decay: 200, sustain: 0.6, release: 300, id: "env" });
```

Driven parameters: `attack`, `hold`, `decay`, `sustain`, `release`.

### Note Modulation

Units can declare note property → parameter mappings via `.noteMod()`:

```typescript
const synth = osc({ type: "sawtooth", id: "lead" });
synth.noteMod("velocity", ["lead.vol.level"]); // velocity controls volume
synth.noteMod("pitch", ["lead.filt.frequency"]); // pitch tracks filter
```

Properties: `"velocity"` (0–1), `"pitch"` (note/127), `"gate"` (1 at start, 0 at stop).

## Note Transforms

Note transforms sit in the unit graph and modify note events before they reach generators.

```typescript
chain(
	harmonizeMidi([0, 4, 7]), // add major triad
	humanizeMidi({ timing: 10, velocity: 15 }), // subtle randomization
	noteFilter((e) => e.velocity > 40), // drop quiet notes
	velocityCurve((v) => Math.pow(v / 127, 0.7) * 127), // soften dynamics
	portamento({ timeMs: 50 }), // pitch glide between notes
	osc({ type: "sawtooth" }),
);
```

## Sources and Targets

### Speakers

Routes audio to the audio context destination for real-time playback.

```typescript
chain(synth, speakers());
```

### Read / Write

File-based source and target for offline processing pipelines.

```typescript
chain(read({ path: "input.wav" }), compressor({ threshold: -12, ratio: 3 }), write({ path: "output.wav", bitDepth: "24" }));
```

## Custom Units

### Custom Effect

Extend `Unit` (from `@resequence/web-au-core`), implement `_setup()` to create AudioNodes and return entry/exit points. Use `driveParam()` to expose parameters for automation.

```typescript
import { Unit, UnitProperties, UnitInput, SetupResult, UnitContext, driveParam } from "@resequence/web-au/core";

interface TremoloProperties extends UnitProperties {
	readonly speed: number;
	readonly depth: number;
}

class TremoloUnit extends Unit {
	readonly type = ["unit", "tremolo"] as const;
	declare readonly properties: TremoloProperties;

	constructor(properties: UnitInput<TremoloProperties>) {
		super(properties);
		this.properties = {
			...properties,
			targets: properties.targets ?? [],
			modDeclarations: properties.modDeclarations ?? [],
		};
	}

	protected override _setup(context: UnitContext): SetupResult {
		const lfoNode = context.audioContext.createOscillator();
		const depthNode = context.audioContext.createGain();
		const outputGain = context.audioContext.createGain();

		lfoNode.frequency.value = this.properties.speed;
		depthNode.gain.value = this.properties.depth;
		outputGain.gain.value = 1 - this.properties.depth / 2;

		lfoNode.connect(depthNode).connect(outputGain.gain);
		lfoNode.start();

		driveParam(lfoNode.frequency, this.id ? `${this.id}.speed` : undefined, this.properties.speed, [0.1, 20], context);

		return { entries: [outputGain], exits: [outputGain] };
	}
}

export function tremolo({ speed, depth, id }: { speed: number; depth: number; id?: string }): TremoloUnit {
	return new TremoloUnit({ speed, depth, id });
}
```

### Custom Generator

Extend `GeneratorUnit` and implement `_schedule()` to create audio sources per note. Use `scheduleVoice()` to route each voice through the generator's processing chain.

```typescript
import { GeneratorUnit, GeneratorUnitProperties, GeneratorUnitInput, NoteEvent, UnitContext, SetupResult } from "@resequence/web-au/core";

class PulseUnit extends GeneratorUnit {
	readonly type = ["unit", "midi", "generator", "pulse"] as const;

	protected override _schedule(noteEvent: NoteEvent, context: UnitContext): void {
		const ne = this.offsetNote(noteEvent, context);
		const osc = context.audioContext.createOscillator();
		osc.type = "square";
		osc.frequency.value = ne.frequency;
		osc.start(ne.startMs / 1000);
		osc.stop(ne.cleanupMs / 1000);

		const cleanup = this.scheduleVoice([osc], ne, context);
		osc.addEventListener("ended", cleanup);
	}
}
```

### Custom Note Transform

Extend `MidiUnit` and override `_schedule()` to modify note events before forwarding them downstream.

```typescript
import { MidiUnit, MidiUnitProperties, NoteEvent, UnitContext } from "@resequence/web-au/core";

class OctaveDoubler extends MidiUnit {
	readonly type = ["unit", "midi", "octave-doubler"] as const;

	protected override _schedule(noteEvent: NoteEvent, context: UnitContext): void {
		super._schedule(noteEvent, context);
		super._schedule({ ...noteEvent, note: noteEvent.note + 12 }, context);
	}
}
```

## CLI

```bash
# Render MIDI through a unit graph to WAV
npx resequence-web-au render --midi input.mid --chain synth.ts --output out.wav

# Process audio through a self-contained graph (read → effects → write)
npx resequence-web-au process --chain pipeline.ts
```

Chain files are TypeScript modules that export a unit graph as their default export.
