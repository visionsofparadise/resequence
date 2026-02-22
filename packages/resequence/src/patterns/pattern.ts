export interface Pattern {
  readonly type: string
  readonly durationTicks: number
  transpose(interval: number): Pattern
  reverse(): Pattern
}
