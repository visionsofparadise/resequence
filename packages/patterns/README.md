# @resequence/patterns

Temporal composition engine for building hierarchical trees of musical events. Patterns describe arrangement — what to play and when — and export to MIDI.

```bash
npm install @resequence/patterns
```

## Overview

Build pattern trees from notes, sequences, layers, repeats, and modifiers. The tree produces a flat stream of typed events — notes, metadata, tempo changes — that downstream systems interpret. MIDI export is built in.

```typescript
import { N, sequence, layer, repeat, gap, note, tempo, metadata, distribute, transpose, echo, renderMidi } from "@resequence/patterns";

const kick = repeat(N.C2(1), 4).route("drums");
const snare = sequence(gap(1), N.D3(1), gap(1), N.D3(1)).route("drums");

const bassline = sequence(N.C2(2), N.Ds2(1), N.F2(1), N.G2(2), N.As2(1), N.G2(1)).route("bass");

const chords = layer(
	sequence(N.C4(4), N.Gs3(4)),
	sequence(N.Ds4(4), N.As3(4)),
	sequence(N.G4(4), N.Ds4(4)),
).route("pad");

const hats = echo(distribute(3, 8, N.Fs2(0.5)), 2, 0.25, 0.6).route("drums");

const song = tempo(
	layer(repeat(layer(kick, snare, hats), 4), repeat(bassline, 2), repeat(chords, 2)),
	128,
);

const midiFiles = renderMidi(song);
// Map<string, Uint8Array> — one MIDI file per port ("drums", "bass", "pad")
```

Patterns are immutable trees. Notes carry `Pitch` objects and beat-based durations. Modifiers transform notes at construction time with structural sharing. Everything composes — patterns into larger patterns, modifiers on top of modifiers.

## Pitch

The `N` namespace provides typed pitch access for the chromatic scale (A4 = 440 Hz). Sharps use `s`, flats use `b`. Each entry is callable — pass a duration in beats to create a note:

```typescript
N.C4(1)         // quarter note middle C
N.Cs4(0.5)      // eighth note C#4
N.Db4(2, 80)    // half note Db4 at velocity 80
N.Fs3(1)        // quarter note F#3
```

Access the `Pitch` object via the `.pitch` property when you need the pitch without creating a note:

```typescript
N.C4.pitch      // Pitch { class: 0, octave: 4, stepsPerOctave: 12, octaveRatio: 2 }
```

### Chords and Scales

`CD` builds chords from a quality string and duration:

```typescript
CD("Cm7", 2);       // Cm7 chord, half note each
CD("Gmaj9", 4);     // Gmaj9 chord, whole note
```

`CS` creates a scale accessor — call it with degree and octave to get notes:

```typescript
const scale = CS("C4 minor");
scale(0);    // C4
scale(2);    // Eb4
```

### Custom Tunings

`createTuning` produces a namespace like `N` for any tuning system:

```typescript
// Equal temperament
const quarterTone = createTuning({
	classes: ["C", "C+", "Cs", "Cs+", "D", /* ... 24 classes */],
	reference: { class: "A", octave: 4, hz: 440 },
});

quarterTone.C4(1);
quarterTone["C+4"](1);    // quarter-tone between C and C#

// Frequency-based (just intonation, custom scales)
const justC = createTuning({
	frequencies: { C: 261.63, D: 294.33, E: 327.03, /* ... */ },
	referenceOctave: 4,
});
```

Built-in tunings: `Chromatic`, `Midi`, `A432`, `QuarterTone`, `Just`, `Pythagorean`, `Meantone`, `Werckmeister`, `Pelog`, `Slendro`, `BohlenPierce`, `Tet19`, `Tet31`, `Tet53`.

## Patterns

### Leaves

**`note(pitch, duration, options?)`** — a single note. Most of the time you'll use the `N` shorthand instead.

**`gap(duration)`** — silence with a duration. Used as a spacer in sequences.

### Containers

**`sequence(...patterns)`** — serial placement. Children play one after another. Duration is the sum.

**`layer(...patterns)`** — parallel placement. Children play simultaneously. Duration is the max.

**`repeat(pattern, count)`** — loop a pattern. Duration is `pattern.duration * count`.

```typescript
// 4-bar drum loop
const drums = repeat(
	layer(
		repeat(N.C2(1), 4),                              // kick on every beat
		sequence(gap(1), N.D3(1), gap(1), N.D3(1)),      // snare on 2 and 4
	),
	4,
);
```

Containers accept `Pattern | Note`, so you can pass raw notes directly: `sequence(N.C4(1), N.E4(1), N.G4(2))`.

## Modifiers

Modifiers wrap a pattern, transform its notes at construction time, and persist as tree nodes. The original pattern is preserved in the modifier's `input` property.

### Pitch

**`transpose(pattern, interval)`** — shift all notes by N steps.

**`harmonize(pattern, intervals)`** — duplicate notes at multiple intervals. `harmonize(melody, [0, 4, 7])` creates a major triad from each note.

**`invertChord(pattern, position)`** — chord inversion. `invertChord(chord, 1)` moves the lowest note up an octave.

**`voicing(pattern, style)`** — rearrange chord voicing. Styles: `"spread"`, `"drop2"`, `"drop3"`, `"firstInversion"`, `"secondInversion"`, etc.

**`flip(pattern)`** — mirror pitches around the midpoint.

**`unison(pattern, spread?)`** — duplicate notes with slight pitch offsets. `unison(melody, { count: 3, interval: 0.1 })`.

**`slide(pattern, options?)`** — add pitch slides between consecutive notes. Options: `duration`, `curve`, `absolute`.

### Rhythm

**`quantize(pattern, grid?, swing?, humanize?, seed?)`** — snap notes to a grid with optional swing and humanization.

**`shuffle(pattern, amount?, seed?)`** — shuffle note timing.

**`stretch(pattern, factor)`** — scale all durations by a factor.

**`length(pattern, duration)`** — set all note durations to a fixed value.

**`legato(pattern)`** — extend each note to meet the next.

**`offset(pattern, beats)`** — shift all notes forward or backward in time.

**`jitter(pattern, amount?, seed?)`** — randomize note timing with deterministic seed.

### Articulation

**`strum(pattern, options?)`** — stagger simultaneous notes like a guitar strum. Options: `direction` (`"up"` / `"down"`), `interval`, `offset`, `seed`.

**`flam(pattern)`** — quick grace note before each note.

**`echo(pattern, count?, delay?, decay?, spread?)`** — create delayed repetitions with decaying velocity.

**`chop(pattern, stepSize)`** — slice notes into repeated steps of fixed size.

**`gate(pattern, ratio?)`** — shorten notes to a fraction of their duration.

**`accent(pattern, positions, amount)`** — boost velocity at specific beat positions.

### Arp

**`arp(pattern, mapping)`** — arpeggiate using a custom rhythm pattern.

**`arpUp(pattern, octaves?)`** — arpeggiate ascending.

**`arpDown(pattern, octaves?)`** — arpeggiate descending.

**`arpUpDown(pattern, octaves?)`** — arpeggiate up then down.

**`arpRandom(pattern, seed?)`** — arpeggiate in random order with deterministic seed.

### Structure

**`slice(pattern, from, to)`** — extract a beat range.

**`trim(pattern, from, to)`** — remove beats from the start and/or end.

**`splice(pattern, index, deleteCount, ...items)`** — remove and insert notes by index.

**`insert(pattern, index, ...items)`** — insert notes at an index.

**`reverse(pattern)`** — reverse note order.

**`rotate(pattern, steps)`** — rotate notes by N positions.

**`sort(pattern, key?)`** — sort notes by `"pitch"`, `"velocity"`, or `"beat"`.

### Dynamics

**`level(pattern, config)`** — adjust velocity and CC values. Supports absolute values, randomization, expansion, and compression.

**`humanize(pattern, config)`** — alias for `level`. Apply randomized velocity variation.

**`polyphony(pattern, voices?)`** — limit simultaneous notes.

### Functional

**`map(pattern, fn)`** — transform each note, returning a replacement.

**`flatMap(pattern, fn)`** — transform each note into zero or more notes.

**`filterNotes(pattern, fn)`** — remove notes that don't match a predicate.

**`thin(pattern, probability, seed?)`** — randomly remove notes.

**`mask(pattern, maskPattern)`** — keep only notes that overlap with the mask pattern's timing.

**`heal(pattern)`** — close gaps between notes by extending durations.

### Non-Destructive

**`mute(pattern)`** — silence without changing duration. The inner pattern remains readable for visualization.

**`skip(pattern)`** — remove from the timeline entirely. Zero duration.

**`unwrap(modifier)`** — bypass a modifier, exposing its input pattern.

**`override(pattern, indexes, callback)`** — targeted deep modification via index path.

**`revert(pattern, indexes, steps)`** — undo modifications by walking the property history chain.

## Generators

Generators produce notes procedurally. They extend `MidiPattern` — routing, modifiers, and containers all work on them.

**`distribute(hits, steps, pitch, stepDuration, rotate?)`** — Euclidean rhythm. Places `hits` evenly across `steps`. The classic Bjorklund algorithm for world rhythm patterns.

```typescript
distribute(3, 8, N.C2.pitch, 0.5);        // tresillo
distribute(5, 16, N.C2.pitch, 0.25, 2);   // rotated 16th pattern
```

**`random(options)`** — random notes with configurable pitch set, velocity range, count, step duration, and deterministic seed.

```typescript
random({ pitches: [N.C4.pitch, N.E4.pitch, N.G4.pitch], count: 16, stepDuration: 0.5, seed: 42 });
```

**`generative(callback, count, duration?)`** — procedural generation with an accumulator. The callback receives all previously generated notes, enabling interdependent relationships.

```typescript
generative((acc, i) => [note(N.C4.pitch, 1)], 8);
```

## Routing

Patterns connect to named output ports via `.route(portName, channel?)`. Port names accumulate through the tree — children inherit parent ports. Notes dispatch to every port in scope.

```typescript
const melody = sequence(N.C4(1), N.E4(1), N.G4(2)).route("lead");
const bass = sequence(N.C2(2), N.G2(2)).route("bass");

layer(melody, bass); // "lead" and "bass" ports produce separate note streams
```

Notes without a route produce no events during scheduling.

## Metadata

Wrap any pattern with metadata for tempo, time signature, tuning, markers, and regions:

```typescript
// Full metadata object
metadata(pattern, { tempo: 140, timeSignature: [3, 4] });

// Individual helpers — each wraps a pattern
tempo(pattern, 128);
tempo(pattern, 120, { keyframes: [{ beat: 0, value: 0.5 }, { beat: 16, value: 1.0 }] });
timeSignature(pattern, [3, 4]);
marker(pattern, "chorus");
cue(pattern, "drop");        // alias for marker
region(pattern, "verse");
tuning(pattern, Just.config);
```

Tempo supports keyframe automation for gradual BPM changes. Values are normalized 0–1, mapped to the range [1, 999] BPM.

## MIDI Export

```typescript
import { renderMidi } from "@resequence/patterns";

const midiFiles = renderMidi(song, { ppq: 480 });
// Map<string, Uint8Array> — one Standard MIDI File per port
```

The renderer handles pitch bend allocation across MIDI channels (avoiding conflicts with simultaneous bends), CC events, lyric meta events, tempo changes, time signatures, and markers.

### CLI

```bash
npx resequence-patterns export --input ./song.ts --output ./midi --ppq 480
```

The entry file must export a `Pattern` as its default export. One `.mid` file is written per port.

## Custom Patterns

### Custom Modifier

Modifiers wrap a pattern and transform its notes at construction time. Extend `ModifierPattern`, define a properties interface, and use `mapNotes()` or `flatMapNotes()` for the transformation.

```typescript
import {
	ModifierPattern, ModifierProperties, PatternProperties, Pattern, Note,
	toPattern, mapNotes, extentOf,
} from "@resequence/patterns";

interface DoubleTimeProperties extends ModifierProperties {
	readonly factor: number;
}

class DoubleTimePattern extends ModifierPattern<DoubleTimeProperties> {
	readonly type = ["pattern", "midi", "modifier", "doubleTime"] as const;

	clone(overrides: Partial<PatternProperties>): DoubleTimePattern {
		return new DoubleTimePattern({ ...this.properties, ...overrides, previousProperties: this.properties });
	}
}

export function doubleTime(pattern: Pattern | Note, factor = 2): DoubleTimePattern {
	const resolved = toPattern(pattern);
	const transformed = mapNotes(resolved, (note) => ({
		...note,
		startBeat: note.startBeat / factor,
		endBeat: note.endBeat / factor,
	}));
	const extent = extentOf(transformed.notes, transformed.children);

	return new DoubleTimePattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: extent.startBeat,
		endBeat: extent.endBeat,
		input: resolved,
		factor,
	});
}
```

The factory function does the work — the class is a thin wrapper storing parameters and implementing `clone()`. The `input` field preserves the unmodified pattern for `revert()`.

### Custom Generator

Generators extend `MidiPattern` and compute notes in their constructor. They produce notes from scratch rather than transforming existing ones.

```typescript
import { MidiPattern, MidiPatternProperties, PatternProperties, RelativeNote, note } from "@resequence/patterns";

interface WalkProperties extends MidiPatternProperties {
	readonly startPitch: number;
	readonly steps: number;
}

class WalkPattern extends MidiPattern<WalkProperties> {
	readonly type = ["pattern", "midi", "generator", "walk"] as const;

	clone(overrides: Partial<PatternProperties>): WalkPattern {
		return new WalkPattern({ ...this.properties, ...overrides, previousProperties: this.properties });
	}
}

export function walk(startPitch: number, steps: number): WalkPattern {
	const notes: RelativeNote[] = [];
	let pitch = startPitch;

	for (let i = 0; i < steps; i++) {
		notes.push({ offsetBeats: i, note: note({ class: pitch % 12, octave: Math.floor(pitch / 12), stepsPerOctave: 12, octaveRatio: 2 }, 1) });
		pitch += Math.random() > 0.5 ? 1 : -1;
	}

	return new WalkPattern({ notes, children: [], startBeat: 0, endBeat: steps, startPitch, steps });
}
```

### Custom Event Types

Patterns can emit arbitrary events via `_setup()`, `_schedule()`, and `_teardown()`. Events are discriminated on `type` and bubble up through the tree unchanged — downstream consumers interpret them.

```typescript
import { Pattern, PatternProperties, Event } from "@resequence/patterns";

interface LightEvent {
	readonly type: "light";
	readonly color: string;
	readonly beat: number;
}

function isLightEvent(event: Event): event is LightEvent {
	return event.type === "light";
}

class LightCuePattern extends Pattern {
	readonly type = ["pattern", "lightCue"] as const;

	override _schedule(absoluteBeat: number): Event[] {
		return [{ type: "light", color: this.properties.color, beat: absoluteBeat }];
	}

	clone(overrides: Partial<PatternProperties>): LightCuePattern {
		return new LightCuePattern({ ...this.properties, ...overrides, previousProperties: this.properties });
	}
}
```

## Tree Utilities

Walk, map, and manipulate pattern trees with structural sharing:

```typescript
import { walkPatterns, walkNotes, collectNotes, mapNotes, flatMapNotes, mapPatterns } from "@resequence/patterns";

// Visit every pattern node
walkPatterns(song, (pattern, absoluteBeat) => { /* ... */ });

// Visit every note with a unique ID and absolute timing
walkNotes(song, (note, context) => {
	console.log(context.id, context.absoluteOffset);
});

// Collect all notes
const notes = collectNotes(song);

// Transform notes (structural sharing — unchanged branches keep identity)
const louder = mapNotes(song, (note) => ({ ...note, velocity: Math.min(127, note.velocity + 20) }));
```

## Validation

```typescript
import { validate } from "@resequence/patterns";

const warnings = validate(song);
// Reports orphaned notes — notes without port routing in their ancestor chain
```
