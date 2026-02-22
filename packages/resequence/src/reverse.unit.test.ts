import { describe, expect, it } from 'vitest'
import { assign, gap, layer, note, repeat, sequence } from './pattern'
import type { AssignNode, GapNode, LayerNode, NoteNode, RepeatNode, SequenceNode } from './pattern'
import { reverse } from './reverse'

describe('reverse', () => {
  it('returns note unchanged', () => {
    const n = note('C4', '4n', { velocity: 80, lyric: 'hel' })
    const result = reverse(n) as NoteNode
    expect(result.type).toBe('note')
    expect(result.pitch).toBe('C4')
    expect(result.duration).toBe('4n')
    expect(result.velocity).toBe(80)
    expect(result.lyric).toBe('hel')
  })

  it('returns gap unchanged', () => {
    const g = gap('8n')
    const result = reverse(g) as GapNode
    expect(result.type).toBe('gap')
    expect(result.duration).toBe('8n')
  })

  it('reverses sequence children', () => {
    const a = note('C4', '4n')
    const b = note('E4', '4n')
    const c = note('G4', '4n')
    const result = reverse(sequence(a, b, c)) as SequenceNode
    expect(result.type).toBe('sequence')
    expect((result.nodes[0] as NoteNode).pitch).toBe('G4')
    expect((result.nodes[1] as NoteNode).pitch).toBe('E4')
    expect((result.nodes[2] as NoteNode).pitch).toBe('C4')
  })

  it('recursively reverses nested sequences', () => {
    const inner = sequence(note('C4', '4n'), note('D4', '4n'))
    const outer = sequence(note('E4', '4n'), inner)
    const result = reverse(outer) as SequenceNode

    const reversedInner = result.nodes[0] as SequenceNode
    expect((reversedInner.nodes[0] as NoteNode).pitch).toBe('D4')
    expect((reversedInner.nodes[1] as NoteNode).pitch).toBe('C4')
    expect((result.nodes[1] as NoteNode).pitch).toBe('E4')
  })

  it('reverses each layer child individually', () => {
    const seq1 = sequence(note('C4', '4n'), note('D4', '4n'))
    const seq2 = sequence(note('E4', '4n'), note('F4', '4n'))
    const result = reverse(layer(seq1, seq2)) as LayerNode

    const reversed1 = result.nodes[0] as SequenceNode
    const reversed2 = result.nodes[1] as SequenceNode
    expect((reversed1.nodes[0] as NoteNode).pitch).toBe('D4')
    expect((reversed1.nodes[1] as NoteNode).pitch).toBe('C4')
    expect((reversed2.nodes[0] as NoteNode).pitch).toBe('F4')
    expect((reversed2.nodes[1] as NoteNode).pitch).toBe('E4')
  })

  it('reverses repeat child', () => {
    const seq = sequence(note('C4', '4n'), note('E4', '4n'))
    const result = reverse(repeat(seq, 4)) as RepeatNode
    expect(result.count).toBe(4)
    const inner = result.node as SequenceNode
    expect((inner.nodes[0] as NoteNode).pitch).toBe('E4')
    expect((inner.nodes[1] as NoteNode).pitch).toBe('C4')
  })

  it('reverses assign child and preserves metadata', () => {
    const inst = { path: './gm.sf2', bank: 0, preset: 0 }
    const seq = sequence(note('C4', '4n'), note('E4', '4n'))
    const result = reverse(assign(seq, { track: 'bass', instrument: inst })) as AssignNode
    expect(result.track).toBe('bass')
    expect(result.instrument).toEqual(inst)
    const inner = result.node as SequenceNode
    expect((inner.nodes[0] as NoteNode).pitch).toBe('E4')
    expect((inner.nodes[1] as NoteNode).pitch).toBe('C4')
  })

  it('preserves all note metadata', () => {
    const n = note('C4', '2n', { velocity: 50, lyric: 'lo' })
    const result = reverse(sequence(n, note('D4', '4n'))) as SequenceNode
    const reversed = result.nodes[1] as NoteNode
    expect(reversed.pitch).toBe('C4')
    expect(reversed.duration).toBe('2n')
    expect(reversed.velocity).toBe(50)
    expect(reversed.lyric).toBe('lo')
  })
})
