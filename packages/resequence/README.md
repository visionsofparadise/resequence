# resequence

Music-as-code. A TypeScript framework for agent-native audio production — composition, synthesis, effects, automation, expressed as code and produced by agents.

```bash
npm install resequence
```

## Overview

A resequence program builds a pattern tree — notes, sequences, layers, repeats, and modifiers — then routes it through an audio graph of generators, effects, and composites. Two composable systems, one design: patterns handle _what to play and when_, units handle _how it sounds_.

```typescript
import {
  N, sequence, layer, repeat, gap, metadata,
  automate, formula, resolveLfo, audio,
  patternSource,
} from "resequence";
import {
  osc, sampler, noise, chain, fan, mix,
  lowpass, highpass, gain, reverb, delay,
  compressor, pan, eq, chorus, envelope,
  lfo, speakers,
} from "resequence/web-au";

// --- Instruments ---

const kick = sampler({ url: "samples/kick.wav", id: "kick" });
const snare = sampler({ url: "samples/snare.wav", id: "snare" });
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

const kickPat = repeat(N.C2(1), 4);
const snarePat = sequence(gap(1), N.D3(1), gap(1), N.D3(1));

const bassline = sequence(
  N.C2(2), N.Ds2(1), N.F2(1),
  N.G2(2), N.As2(1), N.G2(1),
);

const chords = layer(
  sequence(N.C4(4), N.Gs3(4)),
  sequence(N.Ds4(4), N.As3(4)),
  sequence(N.G4(4), N.Ds4(4)),
);

// --- Automation ---

const filterSweep = automate("filter sweep", "bass.bassLp.frequency", formula(
  (t) => t * t,
  { duration: 8, resolution: 32 },
));

// --- Composition ---

const drums = layer(
  kickPat.route("kick"),
  snarePat.route("snare"),
);

const song = metadata(
  layer(
    repeat(drums, 4),
    repeat(bassline, 2).route("bass"),
    repeat(chords, 2).route("pad"),
    repeat(filterSweep, 2),
  ),
  { tempo: 128 },
);

// --- Routing ---

const source = patternSource(song);
source.port("kick").to(kick).to(speakers());
source.port("snare").to(snare).to(speakers());
source.port("bass").to(bass).to(speakers());
source.port("pad").to(pad).to(speakers());

export default source;
```

Patterns are immutable trees. Notes carry `Pitch` objects and beat-based durations. Units form a directed audio graph connected with `.to()`. Automation targets unit parameters by ID path. Everything composes — patterns into larger patterns, units into larger units.

## Packages

The `resequence` package re-exports everything from `@resequence/patterns` (patterns, pitch, tuning, modifiers, generators, MIDI export) at the top level, and everything from `@resequence/web-au` (units, effects, generators, composites) via the `resequence/web-au` subpath.

```typescript
import { N, sequence, layer, repeat, transpose } from "resequence";
import { osc, chain, lowpass, gain, reverb } from "resequence/web-au";
```

On top of the sub-packages, `resequence` provides the orchestration layer: `PatternSource` (routing), `Playback` (real-time), `render()` (offline to WAV), automation constructs, and a CLI.

## Patterns

Patterns are a hierarchical composition system. You build trees of musical events and transformations that produce notes at construction time. Every pattern knows its duration and its notes.

**Leaves** produce notes directly — `note()`, `gap()`, `audio()`.

**Containers** organize children in time — `sequence()` (serial), `layer()` (parallel), `repeat()` (loop).

**Modifiers** transform a child pattern's notes. Over 30 modifiers cover pitch, rhythm, articulation, dynamics, structure, and functional transforms.

**Generators** produce notes procedurally — `distribute()` (Euclidean rhythms), `random()` (constrained randomness), `generative()` (accumulator-based callbacks).

### Routing

Patterns connect to units via `.route(portName)`. This binds each note in the pattern to a named output port. Port names accumulate through the tree — children inherit parent ports. On the source side, `source.port(portName)` creates the audio port and `.to(unit)` connects it to the audio graph.

```typescript
const melody = sequence(N.C4(1), N.E4(1), N.G4(2)).route("lead");
const synth = chain(osc({ type: "sawtooth", id: "lead" }), gain({ level: -6 }));

const source = patternSource(melody);
source.port("lead").to(synth).to(speakers());
```

Notes without a route are orphaned and produce no sound.

### Modifier API

**Pitch**: `transpose`, `harmonize`, `invertChord`, `voicing`, `flip`, `unison`, `slide`

**Rhythm**: `quantize`, `shuffle`, `stretch`, `length`, `legato`, `offset`, `jitter`

**Articulation**: `strum`, `flam`, `echo`, `chop`, `gate`, `accent`

**Arp**: `arp`, `arpUp`, `arpDown`, `arpUpDown`, `arpRandom`

**Structure**: `slice`, `trim`, `splice`, `insert`, `reverse`, `rotate`, `sort`

**Dynamics**: `level`, `humanize`, `polyphony`

**Functional**: `map`, `flatMap`, `reduce`, `filterNotes`, `thin`, `mask`, `heal`

**Non-destructive**: `mute`, `skip`, `unwrap`, `override`, `revert`

### Generators

```typescript
// Euclidean rhythm — 3 hits spread across 8 steps
distribute(3, 8, N.C2.pitch, 0.5);

// Random notes with deterministic seed
random({ pitches: [N.C4.pitch, N.E4.pitch, N.G4.pitch], count: 16, stepDuration: 0.5, seed: 42 });

// Procedural generation with accumulator
generative((acc, i) => [note(N.C4.pitch, 1)], 8);
```

## Units

Units abstract over the Web Audio API. Each unit declares entry and exit audio nodes and connects to other units via `.to()`. Import from `resequence/web-au`.

**Generators** produce sound from MIDI events: `sampler` (sample playback with key mapping and velocity layers), `osc` / `oscillator` (waveform synthesis), `noise` (white, pink, brown).

**Effects** process audio. **Composites** wire units together: `chain` (serial) and `fan` (parallel).

`mix` enables wet/dry control on any effect:

```typescript
import { osc, chain, mix, reverb, gain } from "resequence/web-au";

chain(
  osc({ type: "sawtooth" }),
  mix(reverb({ decay: 2.0 }), 0.3),
  gain({ level: -3 }),
);
```

### IDs and Parameter Paths

Assigning an `id` to a unit creates a namespace for its parameters. Automation and modulation target parameters via dot-separated paths built from these IDs.

```typescript
import { chain, osc, lowpass, gain } from "resequence/web-au";

const synth = chain(
  osc({ type: "sawtooth", id: "osc" }),
  lowpass({ frequency: 2000, id: "lp" }),
  gain({ level: -6, id: "vol" }),
);

// Parameter paths:
// "osc.lp.frequency"   — filter cutoff
// "osc.vol.level"      — output gain
```

The generator's ID prefixes downstream effect IDs, giving each parameter a unique address.

### Effects API

**Filter**: `filter`, `lowpass`, `highpass`, `bandpass`, `notch`, `allpass`, `peaking`, `lowshelf`, `highshelf`

**Dynamics**: `compressor`, `limiter`, `gain`, `fader`

**Time**: `delay`, `reverb`, `convolution`

**Modulation**: `chorus`, `flanger`, `phaser`, `ringmod`, `am`, `fm`

**Distortion**: `distortion`, `waveshaper`, `bitcrush`, `downsample`

**Stereo**: `pan`, `midSide`, `stereoWidth`, `width`, `left`, `right`, `mid`, `side`, `spatial`

**EQ**: `eq`, `crossover`, `multiband`

**Utility**: `mix`, `portamento` / `porta`

**Composites**: `chain`, `fan`, `bypass`, `intercept`

**Modulation units**: `lfo`, `macro`, `envelope` / `env`

**MIDI transforms**: `harmonizeMidi`, `humanizeMidi`, `noteFilter`, `velocityCurve`

**Sources/Targets**: `read`, `write`, `speakers`

## Automation

Automation makes parameters change over time. `automate(name, paths, source)` creates an automation pattern that targets one or more parameter paths with keyframes or an LFO.

Keyframe values are normalized 0–1. Range scaling happens at the driver connection point — automation doesn't need to know the parameter's actual range.

### Keyframe Sources

**formula** — sample a function over a duration. The function receives normalized time `t` (0–1) and returns a value (clamped 0–1).

```typescript
import { automate, formula } from "resequence";

automate("fade in", "synth.vol.level", formula(
  (t) => t,
  { duration: 4, resolution: 16 },
));
```

### LFO Source

Pass an `Lfo` object (via `resolveLfo`) as the source for continuous oscillation:

```typescript
import { automate, resolveLfo } from "resequence";

automate("wobble", "bass.lp.frequency", resolveLfo({
  shape: "sine", value: 0.5, frequency: 4,
}));
```

### LFO Unit

The `lfo` unit provides real-time parameter modulation in the audio graph, independent of the pattern timeline:

```typescript
import { chain, osc, lowpass, lfo } from "resequence/web-au";

chain(
  osc({ type: "sawtooth", id: "synth" }),
  lowpass({ frequency: 1000, id: "filt" }),
  lfo({ path: "synth.filt.frequency", shape: "sine", rate: 2, depth: 0.5 }),
);
```

## Audio Patterns

`audio()` places an audio file in the pattern tree as a timed event:

```typescript
import { audio, sequence } from "resequence";

const vocal = audio("verse vocal", "samples/vocal-verse.wav", 16);
const chorus = audio("chorus vocal", "samples/vocal-chorus.wav", 16);

sequence(vocal, chorus);
```

Options include `playFromBeats` (offset into the file), `transpose` (semitones), and `reversed`.

## Pitch

The `N` namespace provides typed pitch access for 12-TET. Sharps use `s`, flats use `b`. Each entry is callable — pass a duration in beats to create a note:

```typescript
import { N } from "resequence";

N.C4(1)         // quarter note middle C
N.Cs4(0.5)      // eighth note C#4
N.Db4(2, 80)    // half note Db4 at velocity 80
N.Fs3(1)        // quarter note F#3
```

### Chords and Scales

`CD` (chord) and `CS` (scale) provide chord and scale accessors:

```typescript
import { CD, CS } from "resequence";

CD("Cm7", 2);      // Cm7 chord, half note each
CS("C4 minor");     // scale accessor
```

### Custom Tunings

`createTuning` produces a namespace like `N` for any tuning system — microtonal, just intonation, custom scales:

```typescript
import { createTuning } from "resequence";

const quarterTone = createTuning({
  classes: ["C", "C+", "Cs", "Cs+", "D", /* ... 24 classes */],
  reference: { class: "A", octave: 4, hz: 440 },
});

quarterTone.C4(1);       // quarter-tone C4
quarterTone["C+4"](1);   // quarter-tone between C and C#
```

Built-in tunings: `Chromatic` (12-TET), `Midi`, `A432`, `QuarterTone`, `Just`, `Pythagorean`, `Meantone`, `Werckmeister`, `Pelog`, `Slendro`, `BohlenPierce`, `Tet19`, `Tet31`, `Tet53`.

## Duration

Durations are numbers representing beats. A quarter note is `1`, an eighth note is `0.5`, a whole note is `4`.

`resolveDuration` converts named durations to beat values:

```typescript
import { resolveDuration, bars } from "resequence";

resolveDuration("4n")   // 1     (quarter note)
resolveDuration("8n")   // 0.5   (eighth note)
resolveDuration("16n")  // 0.25  (sixteenth note)
resolveDuration("4n.")  // 1.5   (dotted quarter)
resolveDuration("4t")   // 0.667 (quarter triplet)

bars(4)            // 16 (4 bars of 4/4)
bars(2, [3, 4])    // 6  (2 bars of 3/4)
```

## Metadata

Wrap any pattern with metadata for tempo, time signature, tuning, markers, cue points, and regions:

```typescript
import { metadata, tempo, timeSignature, marker, cue, region, tuning } from "resequence";

const song = metadata(
  myPattern,
  { tempo: 140 },
);

// Individual helpers
tempo(120);
timeSignature(3, 4);
marker("chorus", 16);
cue("drop", 32);
region("verse", 0, 16);
```

## PatternSource

`patternSource` wraps a pattern and provides the audio routing layer. It connects pattern port names to unit graphs:

```typescript
import { patternSource } from "resequence";
import { osc, gain, chain, speakers } from "resequence/web-au";

const source = patternSource(song);
source.port("lead").to(chain(osc({ type: "sawtooth" }), gain({ level: -6 }))).to(speakers());
source.port("bass").to(bassUnit).to(speakers());
```

## Rendering

### CLI

```bash
# Render stems to WAV
npx resequence render ./song.ts --out ./stems --master --bit-depth 24

# Real-time playback
npx resequence play ./song.ts

# Export MIDI
npx resequence export-midi ./song.ts --out ./midi --ppq 480
```

The entry file must export a `PatternSource` as its default export.

### Programmatic API

```typescript
import { render, play, patternSource } from "resequence";

// Offline render to WAV stems
const result = await render(source, getSample, {
  output: "./stems",
  sampleRate: 44100,
  bitDepth: "24",
  master: true,
});

// Real-time playback
const playback = play(source, audioContext);
await playback.setup(getSample);
await playback.play();
playback.on("note", (note, beat) => { /* ... */ });
playback.on("marker", (name, beat) => { /* ... */ });
playback.seek(16);
playback.pause();
playback.stop();
```

### MIDI Export

MIDI export is provided by `@resequence/patterns`:

```typescript
import { renderMidi } from "resequence";

const midiFiles = renderMidi(pattern, { ppq: 480 });
// Map<string, Uint8Array> — one MIDI file per port
```

### WAV Encoding

```typescript
import { encodeWav } from "resequence";

const wavBytes = encodeWav(audioBuffer, {
  bitDepth: "24",
  markers: [{ name: "chorus", beat: 16 }],
});
```

## Validation

```typescript
import { validate } from "resequence";

const warnings = validate(pattern);
// Reports orphaned notes (notes without port routing)
```
