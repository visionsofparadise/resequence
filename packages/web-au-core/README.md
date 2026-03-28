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

### Example: Custom Effect

```typescript
import { Unit, UnitProperties, UnitInput, SetupResult, UnitContext, driveParam } from "@resequence/web-au-core";

// Custom properties for this unit
interface BoostProperties extends UnitProperties {
	readonly amount: number;
}

class BoostUnit extends Unit {
	// Type tuple for runtime discrimination — each level adds specificity
	readonly type = ["unit", "boost"] as const;
	// Narrow the inherited properties type to include custom fields
	declare readonly properties: BoostProperties;

	constructor(properties: UnitInput<BoostProperties>) {
		super(properties);
		// Default targets and modDeclarations to empty arrays — UnitInput makes these optional
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	protected override _setup(context: UnitContext): SetupResult {
		const gainNode = context.audioContext.createGain();

		// driveParam connects the AudioParam to the driver system for automation
		// Pass undefined path when there's no id — the param gets a static value instead
		driveParam(gainNode.gain, this.id ? `${this.id}.amount` : undefined, this.properties.amount, [0, 4], context);

		// entries = where signal flows in, exits = where it flows out
		return { entries: [gainNode], exits: [gainNode] };
	}
}

// Factory function — the public API. Users never call `new` directly.
export function boost({ amount, id }: { amount: number; id?: string }): BoostUnit {
	return new BoostUnit({ amount, id });
}
```

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

Parameters are modulated through ConstantSourceNode intermediaries, decoupling producers (automation, LFOs, note properties) from consumers (AudioParams).

```typescript
import { driveParam, offsetParam, proxyDriver, getOrCreateDriver } from "@resequence/web-au-core";

// Full control — normalized 0–1 scaled to range
driveParam(filterNode.frequency, "synth.filter.frequency", 0.5, [20, 20000], context);

// Additive — modulation adds to the base value (for pitch, vibrato)
offsetParam(oscNode.frequency, "synth.frequency", 440, [20, 20000], context);

// Forwarding — expose an inner parameter under a parent namespace
proxyDriver("reverb", "roomSize", "reverb.comb0.feedback", context);
```

## Graph Utilities

```typescript
import { walkUnits, collectUnits, modifyUnits, descendUnit, computeMaxLatency, computeMaxDuration } from "@resequence/web-au-core";

walkUnits(root, (unit, index) => { /* BFS traversal */ });
const all = collectUnits(root);
modifyUnits(root, (unit) => /* return replacement or undefined to keep */);
const latency = computeMaxLatency(root);
```
