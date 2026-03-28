# @resequence/patterns-utils

Shared utilities for MIDI rendering, validation, built-in tunings, and keyframe/slide evaluation. Used across pattern implementations and the rendering pipeline.

```bash
npm install @resequence/patterns-utils
```

Also available as `@resequence/patterns/utils` or `resequence/patterns/utils` when using the full library or bridge package.

## MIDI Rendering

Render a pattern tree to Standard MIDI Files:

```typescript
import { renderMidi, renderAllEvents } from "@resequence/patterns-utils";

const midiFiles = renderMidi(song, { ppq: 480 });
// Map<string, Uint8Array> — one MIDI file per port

const events = renderAllEvents(song);
// Event[] — all events unfiltered (used by the Router for the complete event stream)
```

The renderer handles pitch bend allocation across MIDI channels (avoiding conflicts with simultaneous bends), CC events, lyric meta events, tempo changes, time signatures, and markers.

### Low-Level Encoding

```typescript
import { encodeMidi } from "@resequence/patterns-utils";
import type { MidiNote, MidiPitchBend } from "@resequence/patterns-utils";
```

## Tempo Map

Build tempo-aware time conversion from pattern events:

```typescript
import { collectMetadata, buildTempoMap, beatsToSeconds, secondsToBeats } from "@resequence/patterns-utils";
import type { TempoMap, CollectedMetadata, MarkerPoint, RegionPoint, TempoPoint, TimeSignaturePoint } from "@resequence/patterns-utils";

const metadata = collectMetadata(events);
// metadata.tempoMap, metadata.markers, metadata.timeSignatures, metadata.regions

const seconds = beatsToSeconds(beat, tempoMap);
const beat = secondsToBeats(seconds, tempoMap);
```

## Validation

```typescript
import { validate } from "@resequence/patterns-utils";
import type { ValidationWarning } from "@resequence/patterns-utils";

const warnings = validate(song);
// Reports orphaned notes — notes without port routing in their ancestor chain
```

## Built-in Tunings

All tuning presets except Chromatic (which is in `@resequence/patterns-core` as the default). Each is a pre-configured tuning created via core's `createTuning()` or `createIndexTuning()`:

```typescript
import { Just, Pythagorean, Meantone, Werckmeister, A432, Midi } from "@resequence/patterns-utils";
import { tuning } from "@resequence/patterns-core";

tuning(pattern, Just.config);
```

| Tuning | Description |
|---|---|
| `Midi` | 12-TET A=440, octave range [-1, 9] |
| `A432` | 12-TET A=432 |
| `QuarterTone` | 24 steps per octave |
| `Just` | 5-limit just intonation |
| `Pythagorean` | 3-limit frequency ratios |
| `Meantone` | Quarter-comma meantone |
| `Werckmeister` | Historical well-temperament |
| `Pelog` | 7-step gamelan tuning |
| `Slendro` | 5-step gamelan tuning |
| `BohlenPierce` | 13 steps per tritave (octave ratio 3) |
| `Tet19` / `Tet31` / `Tet53` | Equal temperaments with 19/31/53 steps |
| `I` | Integer-index-based tuning for programmatic access |

### Chord and Scale Utilities

```typescript
import { CD, CS } from "@resequence/patterns-utils";
import type { ScaleAccessor } from "@resequence/patterns-utils";

CD("Cm7", 2);               // chord — returns a layer of notes
CD("Gmaj9", 4);

const scale = CS("C4 minor");
scale(0);                    // C4
scale(2);                    // Eb4
```

## Keyframe Evaluation

```typescript
import { applyCurve, evaluateAt } from "@resequence/patterns-utils";

applyCurve(0.5, "exponential");    // apply curve shaping to a normalized value
evaluateAt(keyframes, beat);       // evaluate a keyframe array at a beat position
```

## Slide Utilities

```typescript
import { evaluateSlide, evaluateSlideCents, mergeSlides } from "@resequence/patterns-utils";
```

Evaluate pitch slides at tick intervals for pitch bend automation. Used by the MIDI rendering pipeline and slide modifier.
