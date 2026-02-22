import { describe, expect, it } from 'vitest'
import { assign, gap, layer, note, repeat, sequence } from './pattern'
import type { AssignNode, NoteNode, RepeatNode, SequenceNode, LayerNode, GapNode } from './pattern'
import { transpose } from './transpose'

describe('transpose', () => {
  it('transposes a single note up', () => {
    const result = transpose(note('C4', '4n'), 7) as NoteNode
    expect(result.type).toBe('note')
    expect(result.pitch).toBe(67) // G4
  })

  it('transposes a single note down', () => {
    const result = transpose(note('C4', '4n'), -12) as NoteNode
    expect(result.pitch).toBe(48) // C3
  })

  it('transposes numeric pitch', () => {
    const result = transpose(note(60, '4n'), 5) as NoteNode
    expect(result.pitch).toBe(65)
  })

  it('preserves velocity', () => {
    const result = transpose(note('C4', '4n', { velocity: 80 }), 3) as NoteNode
    expect(result.velocity).toBe(80)
  })

  it('preserves lyric', () => {
    const result = transpose(note('C4', '4n', { lyric: 'hel' }), 3) as NoteNode
    expect(result.lyric).toBe('hel')
  })

  it('preserves duration', () => {
    const result = transpose(note('C4', '2n'), 3) as NoteNode
    expect(result.duration).toBe('2n')
  })

  it('leaves gap unchanged', () => {
    const result = transpose(gap('4n'), 5) as GapNode
    expect(result.type).toBe('gap')
    expect(result.duration).toBe('4n')
  })

  it('transposes sequence children', () => {
    const result = transpose(sequence(note('C4', '4n'), note('E4', '4n')), 3) as SequenceNode
    expect(result.type).toBe('sequence')
    expect((result.nodes[0] as NoteNode).pitch).toBe(63)
    expect((result.nodes[1] as NoteNode).pitch).toBe(67)
  })

  it('transposes layer children', () => {
    const result = transpose(layer(note('C4', '4n'), note('E4', '4n')), 7) as LayerNode
    expect(result.type).toBe('layer')
    expect((result.nodes[0] as NoteNode).pitch).toBe(67)
    expect((result.nodes[1] as NoteNode).pitch).toBe(71)
  })

  it('transposes repeat child', () => {
    const result = transpose(repeat(note('C4', '4n'), 4), 5) as RepeatNode
    expect(result.type).toBe('repeat')
    expect(result.count).toBe(4)
    expect((result.node as NoteNode).pitch).toBe(65)
  })

  it('transposes assign child and preserves metadata', () => {
    const inst = { path: './gm.sf2', bank: 0, preset: 0 }
    const result = transpose(assign(note('C4', '4n'), { track: 'bass', instrument: inst }), 7) as AssignNode
    expect(result.type).toBe('assign')
    expect(result.track).toBe('bass')
    expect(result.instrument).toEqual(inst)
    expect((result.node as NoteNode).pitch).toBe(67)
  })

  it('transposes nested structures', () => {
    const pattern = assign(
      layer(
        sequence(note('C4', '4n'), note('E4', '4n')),
        note('G4', '2n'),
      ),
      { track: 'lead' },
    )
    const result = transpose(pattern, 2) as AssignNode
    const innerLayer = result.node as LayerNode
    const innerSeq = innerLayer.nodes[0] as SequenceNode
    expect((innerSeq.nodes[0] as NoteNode).pitch).toBe(62)
    expect((innerSeq.nodes[1] as NoteNode).pitch).toBe(66)
    expect((innerLayer.nodes[1] as NoteNode).pitch).toBe(69)
  })

  it('handles negative intervals', () => {
    const result = transpose(note('C4', '4n'), -3) as NoteNode
    expect(result.pitch).toBe(57) // A3
  })

  it('handles zero interval', () => {
    const result = transpose(note('C4', '4n'), 0) as NoteNode
    expect(result.pitch).toBe(60)
  })
})
