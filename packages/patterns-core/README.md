# @resequence/patterns-core

Protocol layer for the pattern system. Base classes, event types, containers, tree utilities, the pitch type system, tuning infrastructure, and type discrimination. This is the extension point for building custom patterns and modifiers.

```bash
npm install @resequence/patterns-core
```

Also available as `@resequence/patterns/core` or `resequence/patterns/core` when using the full library or bridge package.

## Overview

Every pattern in the resequence ecosystem extends the base classes defined here. This package defines what a pattern is — how it schedules events, composes with other patterns, and carries pitch data. Concrete modifiers and generators live in `@resequence/patterns`.

## Event System

Patterns produce events via `schedule()`. Events are discriminated on `type` and bubble up through the tree unchanged.

```typescript
import type { Event, NoteEvent, MetadataEvent, Keyframe } from "@resequence/patterns-core";
```

- **NoteEvent** (`type: "note"`) — pitch, timing, velocity, port routing, slides, CC
- **MetadataEvent** (`type: "metadata"`) — tempo, time signature, tuning, markers, regions
- **BaseEvent** — open extension point for custom event types

## Base Classes

**`Pattern`** — abstract base. Lifecycle: `setup()`, `schedule()`, `teardown()` — all return `Event[]`. Override `_schedule()` to emit events.

**`MidiPattern`** — extends Pattern with port routing. Notes dispatch to all ports in scope. Defaults to Chromatic tuning.

**`ModifierPattern`** — extends MidiPattern. Type marker guaranteeing `properties.input` exists. The extension point for custom modifiers.

```typescript
import { Pattern, MidiPattern, ModifierPattern } from "@resequence/patterns-core";
```

### Type Discrimination

Each pattern carries a `type` tuple for runtime identification:

```typescript
Pattern.is(p)           // ["pattern", ...]
MidiPattern.is(p)       // ["pattern", "midi", ...]
ModifierPattern.is(p)   // ["pattern", "midi", "modifier", ...]
```

## Containers

```typescript
import { sequence, layer, gap, toPattern } from "@resequence/patterns-core";

sequence(N.C4(1), N.E4(1), N.G4(2))     // serial — children play one after another
layer(kick, snare, hihat)                 // parallel — children play simultaneously
gap(2)                                    // silence with duration
toPattern(noteOrPattern)                  // normalize Note | Pattern → Pattern
```

## Metadata and Tempo

```typescript
import { tempo, metadata, timeSignature, marker, cue, region, tuning } from "@resequence/patterns-core";

tempo(pattern, 128);
tempo(pattern, 120, { keyframes: [{ beat: 0, value: 0.5 }, { beat: 16, value: 1.0 }] });
timeSignature(pattern, [3, 4]);
marker(pattern, "chorus");
region(pattern, "verse");
tuning(pattern, customTuning.config);
```

## Pitch

Abstract pitch system supporting arbitrary tuning systems.

```typescript
import { addSteps, pitchToMidi, pitchKey, pitchToCents } from "@resequence/patterns-core";
import type { Pitch } from "@resequence/patterns-core";

addSteps(pitch, 7)              // shift by 7 steps with octave wrapping
pitchToMidi(pitch, tuning)      // { note, bend } for MIDI output
pitchKey(pitch)                 // single integer key
pitchToCents(a, b)              // distance in cents
```

## Notes

```typescript
import { note, N, Chromatic } from "@resequence/patterns-core";

N.C4(1)         // quarter note middle C (Chromatic tuning)
N.Fs3(0.5)      // eighth note F#3
note(pitch, 2)  // note from any Pitch object
```

`Chromatic` is the built-in 12-TET A=440 tuning. Other tuning presets are in `@resequence/patterns-utils`.

## Tuning System

```typescript
import { createTuning, createIndexTuning, addAliases } from "@resequence/patterns-core";
import type { Tuning, TuningNote, ResolvedTuning } from "@resequence/patterns-core";

// Equal temperament
const tuning = createTuning({
	classes: ["C", "D", "E", "F", "G", "A", "B"],
	reference: { class: "A", octave: 4, hz: 440 },
});

// Frequency-based
const just = createTuning({
	frequencies: { C: 261.63, D: 294.33, E: 327.03 },
	referenceOctave: 4,
});

// Index-based (for programmatic access)
const indexed = createIndexTuning(12);
```

## Tree Utilities

```typescript
import { walkPatterns, walkNotes, collectNotes, modifyNotes, flatModifyNotes, modifyPatterns, extentOf } from "@resequence/patterns-core";

walkPatterns(pattern, (p, absoluteBeat) => { /* depth-first */ });
walkNotes(pattern, (note, context) => { /* context.id, context.absoluteBeat */ });
const notes = collectNotes(pattern);
modifyNotes(pattern, (note) => ({ ...note, velocity: 100 }));
```

## Non-Destructive Primitives

```typescript
import { mute, skip } from "@resequence/patterns-core";

mute(pattern)   // silence without changing duration
skip(pattern)   // zero duration, removed from timeline
```

## Frequency Conversion

Used internally by `MidiPattern._schedule()`:

```typescript
import { pitchToFrequency, frequencyToNoteAndBend } from "@resequence/patterns-core";

const hz = pitchToFrequency(pitch, tuning);
const { note, bend } = frequencyToNoteAndBend(hz);
```

## Writing Custom Modifiers

Depend on this package to write modifiers without depending on the full library:

```typescript
import {
	ModifierPattern, ModifierProperties, PatternProperties, Pattern, Note,
	toPattern, modifyNotes,
} from "@resequence/patterns-core";

interface MyModProperties extends ModifierProperties {
	readonly amount: number;
}

class MyModPattern extends ModifierPattern<MyModProperties> {
	readonly type = ["pattern", "midi", "modifier", "myMod"] as const;

	clone(overrides: Partial<PatternProperties>): MyModPattern {
		return new MyModPattern({ ...this.properties, ...overrides });
	}
}

export function myMod(pattern: Pattern | Note, amount: number): MyModPattern {
	const resolved = toPattern(pattern);
	const cloned = resolved.clone({});
	modifyNotes(cloned, (n) => ({ ...n, velocity: n.velocity * amount }));
	return new MyModPattern({
		notes: cloned.notes, children: cloned.children,
		startBeat: cloned.startBeat, endBeat: cloned.endBeat,
		input: resolved, amount,
	});
}
```
