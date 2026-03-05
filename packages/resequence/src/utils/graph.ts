import { MidiPattern } from "../patterns/midi";
import type { Pattern, PatternProperties, RelativeChild, RelativeNote } from "../patterns/pattern";
import type { MidiUnit } from "../units/midi-unit";
import type { Unit } from "../units/unit";
import { mapUnits } from "../units/utils/map-units";

export interface PatternPath {
	readonly patternIndexes: ReadonlyArray<number>;
}

export interface UnitPath {
	readonly patternIndexes: ReadonlyArray<number>;
	readonly outputIndex: number;
	readonly unitIndexes: ReadonlyArray<number>;
}

export interface NotePath {
	readonly patternIndexes: ReadonlyArray<number>;
	readonly noteIndex: number;
}

export interface NoteContext {
	readonly id: string;
	readonly path: NotePath;
	readonly absoluteOffset: number;
}

export interface NodeContext {
	readonly id: string;
	readonly path: PatternPath;
	readonly absoluteOffset: number;
}

export function buildNodeId(indexes: ReadonlyArray<number>): string {
	if (indexes.length === 0) return "root";
	return indexes.join("-");
}

export function extentOf(notes: ReadonlyArray<RelativeNote>, children: ReadonlyArray<RelativeChild>): { startBeat: number; endBeat: number } {
	let startBeat = Infinity;
	let endBeat = -Infinity;

	for (const { offsetBeats, note } of notes) {
		startBeat = Math.min(startBeat, offsetBeats + note.startBeat);
		endBeat = Math.max(endBeat, offsetBeats + note.endBeat);
	}

	for (const { offsetBeats, pattern } of children) {
		startBeat = Math.min(startBeat, offsetBeats + pattern.startBeat);
		endBeat = Math.max(endBeat, offsetBeats + pattern.endBeat);
	}

	if (startBeat === Infinity) return { startBeat: 0, endBeat: 0 };
	if (endBeat === -Infinity) return { startBeat: 0, endBeat: 0 };

	return { startBeat, endBeat };
}

function isUnitPath(path: PatternPath | UnitPath): path is UnitPath {
	return "outputIndex" in path;
}

export function mapGraph(root: Pattern, onPattern: (pattern: Pattern, context: NodeContext) => Pattern, onUnit: (unit: Unit, context: UnitPath) => Unit): Pattern {
	const unitVisited = new Map<Unit, Unit>();
	let nextOutputIndex = 0;

	function walk(pattern: Pattern, parentOffset: number, parentIndexes: ReadonlyArray<number>): Pattern {
		let childrenChanged = false;
		const newChildren: Array<RelativeChild> = [];

		for (const [childIndex, { offsetBeats, pattern: child }] of pattern.children.entries()) {
			const mapped = walk(child, parentOffset + offsetBeats, [...parentIndexes, childIndex]);

			if (mapped !== child) childrenChanged = true;

			newChildren.push({ offsetBeats, pattern: mapped });
		}

		let outputsChanged = false;
		let newOutputs: Array<MidiUnit> | undefined;

		if (MidiPattern.is(pattern)) {
			const mappedOutputs = pattern.outputs.map((output) => {
				const outputIndex = nextOutputIndex++;

				return mapUnits(output, (unit, unitContext) => onUnit(unit, { patternIndexes: parentIndexes, outputIndex, unitIndexes: unitContext.indexes }), [], unitVisited);
			});

			outputsChanged = mappedOutputs.some((output, index) => output !== pattern.outputs[index]);

			if (outputsChanged) newOutputs = mappedOutputs as Array<MidiUnit>;
		}

		let current = pattern;

		if (childrenChanged || outputsChanged) {
			const children = childrenChanged ? newChildren : pattern.children;

			if (newOutputs) {
				current = pattern.clone({ notes: pattern.notes, children, ...extentOf(pattern.notes, children), outputs: newOutputs } as Partial<PatternProperties>);
			} else {
				current = pattern.clone({ notes: pattern.notes, children, ...extentOf(pattern.notes, children) });
			}
		}

		const path: PatternPath = { patternIndexes: parentIndexes };
		const id = buildNodeId(parentIndexes);

		return onPattern(current, { id, path, absoluteOffset: parentOffset });
	}

	return walk(root, 0, []);
}

export function descendGraph(root: Pattern, path: PatternPath): Pattern;
export function descendGraph(root: Pattern, path: UnitPath): Unit;
export function descendGraph(root: Pattern, path: PatternPath | UnitPath): Pattern | Unit {
	let current: Pattern = root;

	for (const index of path.patternIndexes) {
		const child = current.children[index];

		if (!child) throw new Error(`Pattern child index ${index} out of bounds`);

		current = child.pattern;
	}

	if (!isUnitPath(path)) return current;

	if (!MidiPattern.is(current)) throw new Error("Pattern at path is not a MidiPattern");

	const output = current.outputs[path.outputIndex];

	if (!output) throw new Error(`Output index ${path.outputIndex} out of bounds`);

	let unit: Unit = output;

	for (const index of path.unitIndexes) {
		const target = unit.targets[index];

		if (!target) throw new Error(`Unit target index ${index} out of bounds`);

		unit = target;
	}

	return unit;
}

export function descendGraphAndClone(root: Pattern, path: PatternPath, operation: (node: Pattern) => Pattern): Pattern;
export function descendGraphAndClone(root: Pattern, path: UnitPath, operation: (node: Unit) => Unit): Pattern;
export function descendGraphAndClone(root: Pattern, path: PatternPath | UnitPath, operation: ((node: Pattern) => Pattern) | ((node: Unit) => Unit)): Pattern {
	if (isUnitPath(path)) {
		const unitOp = operation as (node: Unit) => Unit;

		return descendPatternAndClone(root, path.patternIndexes, (pattern) => {
			if (!MidiPattern.is(pattern)) throw new Error("Pattern at path is not a MidiPattern");

			const output = pattern.outputs[path.outputIndex];

			if (!output) throw new Error(`Output index ${path.outputIndex} out of bounds`);

			const newOutput = descendUnitAndClone(output, path.unitIndexes, unitOp);

			if (newOutput === output) return pattern;

			const newOutputs = pattern.outputs.map((out, index) => (index === path.outputIndex ? newOutput : out));

			return pattern.clone({ notes: pattern.notes, children: pattern.children, ...extentOf(pattern.notes, pattern.children), outputs: newOutputs } as Partial<PatternProperties>);
		});
	}

	return descendPatternAndClone(root, path.patternIndexes, operation as (node: Pattern) => Pattern);
}

function descendPatternAndClone(pattern: Pattern, indexes: ReadonlyArray<number>, operation: (node: Pattern) => Pattern): Pattern {
	if (indexes.length === 0) return operation(pattern);

	const targetIndex = indexes[0];
	if (targetIndex === undefined) return pattern;
	const rest = indexes.slice(1);
	const child = pattern.children[targetIndex];

	if (!child) throw new Error(`Child index ${targetIndex} out of bounds (pattern has ${pattern.children.length} children)`);

	const modifiedChild = descendPatternAndClone(child.pattern, rest, operation);
	const newChildren: Array<RelativeChild> = pattern.children.map((entry, position) => (position === targetIndex ? { offsetBeats: entry.offsetBeats, pattern: modifiedChild } : entry));

	return pattern.clone({ notes: pattern.notes, children: newChildren, ...extentOf(pattern.notes, newChildren) });
}

function descendUnitAndClone(root: Unit, unitIndexes: ReadonlyArray<number>, operation: (node: Unit) => Unit): Unit {
	if (unitIndexes.length === 0) return operation(root);

	const targetIndex = unitIndexes[0];

	if (targetIndex === undefined) return root;

	const target = root.targets[targetIndex];

	if (!target) throw new Error(`Unit target index ${targetIndex} out of bounds`);

	const rest = unitIndexes.slice(1);
	const modifiedTarget = descendUnitAndClone(target, rest, operation);

	if (modifiedTarget === target) return root;

	const newTargets = root.targets.map((entry, index) => (index === targetIndex ? modifiedTarget : entry));

	return root.clone({ targets: newTargets });
}
