# resequence

Music-as-code. A TypeScript production toolkit where patterns describe arrangement and units describe audio.

## Install

```bash
npm install resequence
```

## Overview

A resequence program builds a pattern tree — notes, sequences, layers, repeats, and modifiers — then routes it through an audio processing graph of generators, effects, and composites. Two composable systems, one design: patterns handle *what to play and when*, units handle *how it sounds*.

```typescript
import {
  N, sequence, layer, repeat, note, gap, automate, formula,
  tempo, metadata, sampler, chain, osc, lowpass, gain, reverb,
  delay, compressor, sidechain, mix, pan, resolveDuration,
} from "resequence";

// --- Instruments ---

const kick = sampler("samples/kick.wav", { id: "kick" });
const snare = sampler("samples/snare.wav", { id: "snare" });
const bass = chain(
  osc({ type: "sawtooth", id: "bass" }),
  lowpass({ frequency: 800, resonance: 4, id: "bassLp" }),
  gain({ level: -6 }),
);
const pad = chain(
  osc({ type: "triangle", id: "pad" }),
  mix(reverb({ decay: 2.5 }), 0.4),
  pan({ angle: -0.3 }),
);

// --- Patterns ---

const kickPat = repeat(N.C2.for(1), 4);
const snarePat = sequence(gap(1), N.D3.for(1), gap(1), N.D3.for(1));

const bassline = sequence(
  N.C2.for(2), N.Ds2.for(1), N.F2.for(1),
  N.G2.for(2), N.As2.for(1), N.G2.for(1),
);

const chords = layer(
  sequence(N.C4.for(4), N.Gs3.for(4)),
  sequence(N.Ds4.for(4), N.As3.for(4)),
  sequence(N.G4.for(4), N.Ds4.for(4)),
);

// --- Automation ---

const filterSweep = automate("filter sweep", "bass.bassLp.frequency", formula(
  (t) => t * t, // quadratic rise
  { duration: 8, resolution: 32 },
));

const duckKick = automate("sidechain", "pad.level", sidechain(kickPat, {
  depth: 0.8, attack: 0.01, release: resolveDuration("8n"), tension: -0.5,
}));

// --- Composition ---

const drums = layer(
  kickPat.route(kick),
  snarePat.route(snare),
);

const song = metadata(
  layer(
    repeat(drums, 4),
    repeat(bassline, 2).route(bass),
    repeat(chords, 2).route(pad),
    repeat(filterSweep, 2),
    repeat(duckKick, 4),
  ),
  { tempo: 128 },
);
```

Patterns are immutable trees. Notes carry `Pitch` objects and beat-based durations. Units form a directed audio graph connected with `.to()`. Automation targets unit parameters by ID path. Everything composes — patterns into larger patterns, units into larger units.

## Patterns

Patterns are a hierarchical composition system. You build trees of musical events and transformations that produce a flat array of `ScoreNote` objects at construction time. Every pattern knows its `durationBeats` and its `notes`.

**Leaves** produce notes directly — `note`, `gap`, `audio`.

**Containers** organize children in time — `sequence` (serial), `layer` (parallel), `repeat` (loop).

**Modifiers** transform a child pattern's notes. Over 30 modifiers cover pitch, rhythm, articulation, dynamics, structure, and functional transforms.

**Generators** produce notes procedurally — `distribute` (Euclidean rhythms), `random` (constrained randomness), `generative` (accumulator-based callbacks).

### Routing

Patterns connect to units via `.route(unit)`. This binds each note in the pattern to the target unit so that during playback, notes dispatch to the correct audio generator.

```typescript
const melody = sequence(N.C4.for(1), N.E4.for(1), N.G4.for(2));
const synth = osc({ type: "sawtooth", id: "lead" });

melody.route(synth);
```

Notes without a route are orphaned and produce no sound.

### API

**Leaves**: `note`, `gap`, `audio`

**Containers**: `sequence`, `layer`, `repeat`

**Pitch**: `transpose`, `harmonize`, `invertChord`, `voicing`, `flip`, `unison`

**Rhythm**: `quantize`, `shuffle`, `stretch`, `length`, `legato`, `offset`, `jitter`

**Articulation**: `strum`, `flam`, `echo`, `chop`, `gate`, `slide`, `accent`

**Arp**: `arp`, `arpUp`, `arpDown`, `arpUpDown`, `arpRandom`

**Structure**: `slice`, `trim`, `splice`, `insert`, `reverse`, `rotate`, `sort`

**Dynamics**: `level`, `humanize`, `polyphony`

**Functional**: `map`, `flatMap`, `reduce`, `filterNotes`, `thin`, `mask`, `heal`

**Generators**: `distribute`, `random`, `generative`

## Units

Units abstract over the Web Audio API. Each unit declares entry and exit audio nodes and connects to other units via `.to()`.

**Generators** produce sound from MIDI events: `sampler` (sample playback with key mapping and velocity layers), `osc` / `oscillator` (waveform synthesis), `noise` (white, pink, brown).

**Effects** process audio. **Composites** wire units together: `chain` (serial) and `fan` (parallel).

`mix` enables wet/dry control on any effect:

```typescript
chain(
  osc({ type: "sawtooth" }),
  mix(reverb({ decay: 2.0 }), 0.3), // 30% wet, 70% dry
  gain({ level: -3 }),
);
```

### IDs and Parameter Paths

Assigning an `id` to a unit creates a namespace for its parameters. Automation and modulation target parameters via dot-separated paths built from these IDs.

```typescript
const synth = chain(
  osc({ type: "sawtooth", id: "osc" }),
  lowpass({ frequency: 2000, id: "lp" }),
  gain({ level: -6, id: "vol" }),
);
```

When routed from a generator, paths include the full chain of IDs:

```
"osc.lp.frequency"   // filter cutoff
"osc.vol.level"       // output gain
```

The path system is a flat map keyed by ID. The generator's ID prefixes downstream effect IDs, giving each parameter a unique address.

### API

**Generators**: `sampler`, `oscillator` / `osc`, `noise`

**Filter**: `filter`, `lowpass`, `highpass`

**Dynamics**: `compressor`, `limiter`, `gain`

**Time**: `delay`, `reverb`, `convolution`

**Modulation**: `chorus`, `flanger`, `phaser`, `ringmod`, `am`, `fm`

**Distortion**: `distortion`, `waveshaper`, `bitcrush`, `downsample`, `sampleRate`

**Stereo**: `pan`, `midSide`, `stereoWidth`, `width`, `left`, `right`, `mid`, `side`, `spatial`

**EQ**: `eq`, `crossover`, `multiband`

**Utility**: `mix`, `portamento` / `porta`

**Composites**: `chain`, `fan`

**Modulation units**: `lfo`, `macro`, `envelope` / `env`

**MIDI transforms**: `harmonizeMidi`, `humanizeMidi`, `noteFilter`, `velocityCurve`

## Automation

Automation makes parameters change over time. `automate(name, paths, source)` creates an automation pattern that targets one or more parameter paths with either keyframes or an LFO.

Keyframe values are normalized 0–1. Range scaling happens at the driver connection point — automation doesn't need to know the parameter's actual range.

### Keyframe Sources

**formula** — sample a function over a duration. The function receives normalized time `t` (0–1) and returns a value (clamped 0–1).

```typescript
automate("fade in", "synth.vol.level", formula(
  (t) => t, // linear rise
  { duration: 4, resolution: 16 },
));
```

**trigger** — convert note events into attack/release envelopes. Each note triggers a rise to peak, then a shaped release curve.

```typescript
automate("envelope", "pad.lp.frequency", trigger(kickPattern, {
  peak: 1.0, attack: 0.01, release: "4n", tension: -0.3,
}));
```

**sidechain** — inverted trigger envelopes for ducking. Volume dips on each hit and recovers.

```typescript
automate("duck", "pad.vol.level", sidechain(kickPattern, {
  depth: 0.8, attack: 0.01, release: "8n",
}));
```

**invert** — flip all keyframe values (1 - value).

### LFO Source

Pass an `Lfo` object (via `resolveLfo`) as the source for continuous oscillation:

```typescript
automate("wobble", "bass.lp.frequency", resolveLfo({
  shape: "sine", value: 0.5, frequency: "4n",
}));
```

### LFO Unit

The `lfo` unit provides real-time parameter modulation in the audio graph, independent of the pattern timeline:

```typescript
chain(
  osc({ type: "sawtooth", id: "synth" }),
  lowpass({ frequency: 1000, id: "filt" }),
  lfo({ path: "synth.filt.frequency", shape: "sine", rate: 2, depth: 0.5 }),
);
```

### API

**Keyframe sources**: `formula`, `trigger`, `sidechain`, `invert`

**LFO**: `resolveLfo`, `lfo`

**Keyframe types**: `Keyframe`, `CurveKeyframe`, `KeyframeCurve`

## Pitch

The `N` namespace provides typed pitch access for 12-TET. Sharps use `s`, flats use `b`:

```typescript
N.C4     // middle C
N.Cs4    // C#4
N.Db4    // Db4 (same pitch as C#4)
N.Fs3    // F#3
```

Each entry has a `.pitch` property (the `Pitch` object) and a `.for(duration, velocity?)` method that returns a `NotePattern`:

```typescript
N.C4.for(1)        // quarter note middle C
N.E4.for(0.5)      // eighth note E4
N.G4.for(2, 80)    // half note G4 at velocity 80
```

The `Chromatic` namespace extends `N` with chord and scale helpers:

```typescript
Chromatic.chord(N.C4.pitch, "m7", 2)  // Cm7 chord, half note
Chromatic.scale("C4 minor")           // scale accessor
```

### Custom Tunings

`createTuning` produces a namespace like `N` for any tuning system — microtonal, just intonation, custom scales:

```typescript
const quarterTone = createTuning({
  classes: ["C", "C+", "Cs", "Cs+", "D", /* ... 24 classes */],
  reference: { class: "A", octave: 4, hz: 440 },
});

quarterTone.C4.for(1)    // quarter-tone C4
quarterTone["C+4"].for(1) // quarter-tone between C and C#
```

### The Pitch Type

Pitches are `Pitch` objects with `class`, `octave`, `stepsPerOctave`, and `octaveRatio`. Use `resolvePitch` to convert MIDI numbers:

```typescript
resolvePitch(60) // → Pitch for middle C
```

## Duration

Durations are numbers representing beats. A quarter note is `1`, an eighth note is `0.5`, a whole note is `4`.

`resolveDuration` converts named durations to beat values:

```typescript
resolveDuration("4n")   // 1     (quarter note)
resolveDuration("8n")   // 0.5   (eighth note)
resolveDuration("16n")  // 0.25  (sixteenth note)
resolveDuration("4n.")  // 1.5   (dotted quarter)
resolveDuration("4t")   // 0.667 (quarter triplet)
```

`bars` converts bar counts to beats:

```typescript
bars(4)            // 16 (4 bars of 4/4)
bars(2, [3, 4])    // 6  (2 bars of 3/4)
```

## Metadata

Wrap any pattern with metadata for tempo, time signature, tuning, markers, cue points, and regions:

```typescript
const song = metadata(
  myPattern,
  { tempo: 140 },
);

// Or use individual helpers
tempo(120)
timeSignature(3, 4)
marker("chorus", 16)
cue("drop", 32)
region("verse", 0, 16)
```

## Rendering

### MIDI Export

```typescript
const result = renderMidi(pattern);
const midiBytes = encodeMidi(result); // Uint8Array — Standard MIDI File
```

### Audio Rendering

```typescript
const audioBuffer = await renderAudio(pattern, { sampleRate: 44100 });
const wavBytes = encodeWav(audioBuffer); // Uint8Array
```

### Playback

```typescript
const playback = new Playback(pattern);
await playback.play();
playback.on("note", (note, beat) => { /* ... */ });
playback.pause();
playback.stop();
```
