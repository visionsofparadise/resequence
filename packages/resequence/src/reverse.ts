import { gap, layer, note, repeat, assign, sequence } from './pattern'
import type { Pattern } from './pattern'

export function reverse(pattern: Pattern): Pattern {
  switch (pattern.type) {
    case 'note':
      return note(pattern.pitch, pattern.duration, {
        velocity: pattern.velocity,
        lyric: pattern.lyric,
      })
    case 'gap':
      return gap(pattern.duration)
    case 'sequence':
      return sequence(...[...pattern.nodes].reverse().map((child) => reverse(child)))
    case 'layer':
      return layer(...pattern.nodes.map((child) => reverse(child)))
    case 'repeat':
      return repeat(reverse(pattern.node), pattern.count)
    case 'assign':
      return assign(reverse(pattern.node), {
        track: pattern.track,
        instrument: pattern.instrument,
      })
  }
}
