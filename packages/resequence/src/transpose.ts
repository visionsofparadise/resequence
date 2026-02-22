import { gap, layer, note, repeat, assign, sequence } from './pattern'
import type { Pattern } from './pattern'
import { resolvePitch } from './pitch'

export function transpose(pattern: Pattern, interval: number): Pattern {
  switch (pattern.type) {
    case 'note': {
      const midi = resolvePitch(pattern.pitch) + interval
      return note(midi, pattern.duration, {
        velocity: pattern.velocity,
        lyric: pattern.lyric,
      })
    }
    case 'gap':
      return gap(pattern.duration)
    case 'sequence':
      return sequence(...pattern.nodes.map((child) => transpose(child, interval)))
    case 'layer':
      return layer(...pattern.nodes.map((child) => transpose(child, interval)))
    case 'repeat':
      return repeat(transpose(pattern.node, interval), pattern.count)
    case 'assign':
      return assign(transpose(pattern.node, interval), {
        track: pattern.track,
        instrument: pattern.instrument,
      })
  }
}
