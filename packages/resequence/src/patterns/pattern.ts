import type { CompiledNode } from '../compiled'

export interface Pattern {
  readonly type: string
  compile(startTick: number): CompiledNode
  transpose(interval: number): Pattern
  reverse(): Pattern
}
