import type {
  CompiledAssignNode,
  CompiledGapNode,
  CompiledLayerNode,
  CompiledNode,
  CompiledNoteNode,
  CompiledRepeatNode,
  CompiledSequenceNode,
} from './compiled'
import { resolveDuration } from './duration'
import type { Duration } from './duration'
import type { Instrument } from './instrument'
import { resolvePitch } from './pitch'
import type { Pitch } from './pitch'

export type CompileChild = (pattern: Pattern, startTick: number) => CompiledNode

export interface NoteNode {
  readonly type: 'note'
  readonly pitch: Pitch
  readonly duration: Duration
  readonly velocity: number
  readonly lyric?: string
}

export function note(pitch: Pitch, duration: Duration, options?: { velocity?: number; lyric?: string }): NoteNode {
  return { type: 'note', pitch, duration, velocity: options?.velocity ?? 100, lyric: options?.lyric }
}

export function compileNote(node: NoteNode, startTick: number): CompiledNoteNode {
  const durationTicks = resolveDuration(node.duration)
  const pitch = resolvePitch(node.pitch)

  return { type: 'note', startTick, durationTicks, pitch, velocity: node.velocity, lyric: node.lyric }
}

export interface GapNode {
  readonly type: 'gap'
  readonly duration: Duration
}

export function gap(duration: Duration): GapNode {
  return { type: 'gap', duration }
}

export function compileGap(node: GapNode, startTick: number): CompiledGapNode {
  const durationTicks = resolveDuration(node.duration)
  return { type: 'gap', startTick, durationTicks }
}

export interface SequenceNode {
  readonly type: 'sequence'
  readonly nodes: ReadonlyArray<Pattern>
}

export function sequence(...nodes: ReadonlyArray<Pattern>): SequenceNode {
  return { type: 'sequence', nodes }
}

export function compileSequence(node: SequenceNode, startTick: number, compileChild: CompileChild): CompiledSequenceNode {
  let tick = startTick

  const children: Array<CompiledNode> = []

  for (const child of node.nodes) {
    const compiled = compileChild(child, tick)
    children.push(compiled)
    tick += compiled.durationTicks
  }

  return { type: 'sequence', startTick, durationTicks: tick - startTick, nodes: children }
}

export interface LayerNode {
  readonly type: 'layer'
  readonly nodes: ReadonlyArray<Pattern>
  readonly duration?: Duration
}

export function layer(...nodes: ReadonlyArray<Pattern>): LayerNode {
  return { type: 'layer', nodes }
}

export function compileLayer(node: LayerNode, startTick: number, compileChild: CompileChild): CompiledLayerNode {
  const children = node.nodes.map((child) => compileChild(child, startTick))

  const durationTicks =
    node.duration !== undefined
      ? resolveDuration(node.duration)
      : Math.max(0, ...children.map((child) => child.durationTicks))

  return { type: 'layer', startTick, durationTicks, nodes: children }
}

export interface RepeatNode {
  readonly type: 'repeat'
  readonly node: Pattern
  readonly count: number
}

export function repeat(node: Pattern, count: number): RepeatNode {
  return { type: 'repeat', node, count }
}

// Compile child once at repeat's startTick.
// Viewer handles repetition offsets: iteration i starts at startTick + i * child.durationTicks.
export function compileRepeat(node: RepeatNode, startTick: number, compileChild: CompileChild): CompiledRepeatNode {
  const child = compileChild(node.node, startTick)
  const durationTicks = child.durationTicks * node.count

  return { type: 'repeat', startTick, durationTicks, count: node.count, node: child }
}

export interface AssignNode {
  readonly type: 'assign'
  readonly node: Pattern
  readonly track: string
  readonly instrument?: Instrument
}

export function assign(node: Pattern, config: { track: string; instrument?: Instrument }): AssignNode {
  return { type: 'assign', node, track: config.track, instrument: config.instrument }
}

export function compileAssign(node: AssignNode, startTick: number, compileChild: CompileChild): CompiledAssignNode {
  const child = compileChild(node.node, startTick)

  return { type: 'assign', startTick, durationTicks: child.durationTicks, track: node.track, instrument: node.instrument, node: child }
}

export type Pattern =
  | NoteNode
  | GapNode
  | SequenceNode
  | LayerNode
  | RepeatNode
  | AssignNode
