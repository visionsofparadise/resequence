# @resequence/web-au-utils

Shared utilities for pitch conversion, MIDI parsing, slide scheduling, and WAV encoding. Used across unit implementations and the rendering pipeline.

```bash
npm install @resequence/web-au-utils
```

## Pitch

```typescript
import { pitchToMidi } from "@resequence/web-au-utils";

const { note, cents } = pitchToMidi(pitch);
```

Converts a `Pitch` object to a MIDI note number with cents offset.

## MIDI Import

Parse Standard MIDI Files into NoteEvent arrays.

```typescript
import { parseMidiFile, CC } from "@resequence/web-au-utils";

const events = parseMidiFile(midiBytes);
```

Converts tempo maps, CC values (volume, pan, sustain, cutoff, resonance, chorus, reverb), and pitch bends into NoteEvent properties. The `CC` object provides named constants for standard MIDI controller numbers.

## Slide Scheduling

```typescript
import { scheduleSlideRamps } from "@resequence/web-au-utils";

scheduleSlideRamps(oscNode.frequency, baseFrequency, noteEvent.slides, startTime, transformer);
```

Schedules pitch bend ramps on an AudioParam from a note's slide data.

## WAV Encoding

```typescript
import { encodeWav } from "@resequence/web-au-utils";

const wavBytes = encodeWav(audioBuffer, { bitDepth: "24" });
```

Encodes an `AudioBuffer` to WAV. Supports 16, 24, 32, 32f, and 64-bit depths.
