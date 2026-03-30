# @resequence/web-au-core

Protocol layer for the Web Audio unit system. Base classes, lifecycle management, the driver system for parameter modulation, and graph utilities. This is the extension point for building custom units.

```bash
npm install @resequence/web-au-core
```

## Overview

Every audio processor in the resequence ecosystem is a `Unit` subclass. This package defines what a unit is — how it sets up AudioNodes, connects to other units, exposes parameters for modulation, and tears down when done. Concrete unit implementations (oscillators, filters, reverbs, etc.) live in `@resequence/web-au`.

## Unit

The base class for all audio processing. A unit manages AudioNode creation, signal routing, and modulation connections.

```typescript
import { Unit, UnitProperties, SetupResult, UnitContext } from "@resequence/web-au-core";
```

**Lifecycle:**

- `_setup(context)` — create AudioNodes, return `{ entries, exits }` defining signal flow
- `_teardown(context)` — clean up nodes

**Routing:** `.to(unit)` connects this unit's exits to the target's entries.

**Modulation:** `.mod(paths, transform?)` declares that this unit's output modulates the given parameter paths.

**Type discrimination:** Each unit carries a `type` tuple (e.g. `["unit", "gain"]`) with a static `is()` guard for runtime narrowing.

### Schema and Parameters

Every leaf unit declares a static Zod schema and an instance `parameters` object. The schema is the single source of truth for parameter definitions — the studio uses it to render control panels, and the driver system reads paths and ranges from `LiveParameter` instances.

```typescript
import { z } from "zod";
import { Unit, UnitProperties, UnitInput, SetupResult, UnitContext, driveParam, createParameters, LiveParameter } from "@resequence/web-au-core";

interface BoostProperties extends UnitProperties {
  readonly amount: number;
}

class BoostUnit extends Unit {
  readonly type = ["unit", "boost"] as const;
  declare readonly properties: BoostProperties;

  // Schema defines parameter shapes, ranges, and metadata
  static readonly schema = z.object({
    amount: z.number().min(0).max(4).default(1).describe("Boost Amount").meta({ live: true }),
  });

  // Parameters are created from the schema and properties
  readonly parameters = createParameters(BoostUnit.schema, this.id, this.properties);

  constructor(properties: UnitInput<BoostProperties>) {
    super(properties);
    this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
  }

  protected override _setup(context: UnitContext): SetupResult {
    const gainNode = context.audioContext.createGain();

    // driveParam reads path, value, and range from the LiveParameter
    driveParam(gainNode.gain, this.parameters.amount as LiveParameter, context);

    return { entries: [gainNode], exits: [gainNode] };
  }
}

export function boost({ amount, id }: { amount: number; id?: string }): BoostUnit {
  return new BoostUnit({ amount, id });
}
```

**Two parameter types:**

- `meta({ live: true })` on a `z.number()` field produces a `LiveParameter` — backed by a driver, supports `set()` and `subscribe()`.
- All other fields produce a `Parameter<T>` — value only, structural. Changing them requires teardown and rebuild.

### LiveParameter

```typescript
const param = unit.parameters.amount as LiveParameter;

// Update value — writes to the bound AudioParam and notifies subscribers
param.set(0.75);

// Subscribe to value changes
const unsubscribe = param.subscribe((value) => {
  console.log("Amount changed to", value);
});
```

`set(value)` updates `.value`, writes to the bound AudioParam (normalized if driven through a driver, raw if bound directly), and notifies subscribers. Pre-bind calls update the value and notify — the audio write is a no-op until `bind()` is called during setup.

## MidiUnit

Extends `Unit` for units that receive note events.

- `_schedule(noteEvent, context)` — handle an incoming note
- `.noteMod(property, paths, transform?)` — map note properties (`"velocity"`, `"pitch"`, `"gate"`) to parameter paths

## CompositeUnit

Base for units that contain other units (chain, fan). Manages internal routing and target forwarding.

## UnitContext

Provided to units during lifecycle calls:

```typescript
const context = createUnitContext(audioContext, getSample, loadModule, latencyBudget, basePath);
```

- `audioContext` — the Web Audio context
- `driverMap` — shared registry of parameter modulation drivers
- `getSample(path)` — load and cache audio buffers (supports `path#region` for WAV cue point extraction)
- `loadModule(url)` — register AudioWorklet modules
- `latencyBudget` — delay compensation in samples
- `basePath` — resolve relative file paths

## Driver System

Parameters are modulated through ConstantSourceNode intermediaries, decoupling producers (automation, LFOs, note properties) from consumers (AudioParams). The driver functions accept `LiveParameter` instances directly — paths, values, and ranges are read from the parameter.

```typescript
import { driveParam, offsetParam, proxyDriver, getOrCreateDriver, LiveParameter } from "@resequence/web-au-core";

// Full control — LiveParameter carries path, value, min, max
driveParam(filterNode.frequency, filterParams.frequency as LiveParameter, context);

// Additive — modulation adds to the base value (for pitch, vibrato)
offsetParam(oscNode.frequency, oscParams.frequency as LiveParameter, context);

// Forwarding — expose an inner parameter under a parent namespace
proxyDriver(reverbParams.roomSize as LiveParameter, innerParams.feedback as LiveParameter, context);
```

## Graph Utilities

```typescript
import { walkUnits, collectUnits, modifyUnits, descendUnit, computeMaxLatency, computeMaxDuration } from "@resequence/web-au-core";

walkUnits(root, (unit, index) => { /* BFS traversal */ });
const all = collectUnits(root);
modifyUnits(root, (unit) => /* return replacement or undefined to keep */);
const latency = computeMaxLatency(root);
```
