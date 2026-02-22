import { describe, expect, it } from 'vitest'
import { compile } from './compile'
import type { CompiledAssignNode, CompiledLayerNode, CompiledRepeatNode, CompiledSequenceNode } from './compiled'
import { PPQ } from './duration'
import { assign } from './patterns/assign'
import { gap } from './patterns/gap'
import { layer, LayerPattern } from './patterns/layer'
import { note } from './patterns/note'
import { repeat } from './patterns/repeat'
import { sequence } from './patterns/sequence'

const config = { tempo: 120, key: 'C', timeSignature: [4, 4] as const }

describe('compile', () => {
  describe('note', () => {
    it('compiles a single note with correct timing and pitch', () => {
      const result = compile(note('C4', '4n'), config)
      expect(result.tree).toEqual({
        type: 'note',
        startTick: 0,
        durationTicks: PPQ,
        pitch: 60,
        velocity: 100,
        lyric: undefined,
      })
    })

    it('carries lyric through', () => {
      const result = compile(note('C4', '4n', { lyric: 'hel' }), config)
      expect(result.tree).toMatchObject({ lyric: 'hel' })
    })

    it('passes through numeric pitch', () => {
      const result = compile(note(36, '8n'), config)
      expect(result.tree).toMatchObject({ pitch: 36, durationTicks: PPQ / 2 })
    })

    it('resolves string pitch to MIDI number', () => {
      const result = compile(note('Eb2', '4n'), config)
      expect(result.tree).toMatchObject({ pitch: 39 })
    })

    it('uses custom velocity', () => {
      const result = compile(note('C4', '4n', { velocity: 80 }), config)
      expect(result.tree).toMatchObject({ velocity: 80 })
    })
  })

  describe('gap', () => {
    it('compiles with correct startTick and durationTicks', () => {
      const result = compile(gap('4n'), config)
      expect(result.tree).toEqual({ type: 'gap', startTick: 0, durationTicks: PPQ })
    })
  })

  describe('sequence', () => {
    it('places children sequentially', () => {
      const result = compile(sequence(note('C4', '4n'), note('D4', '4n')), config)
      const tree = result.tree as CompiledSequenceNode
      expect(tree.nodes[0]).toMatchObject({ startTick: 0, durationTicks: PPQ })
      expect(tree.nodes[1]).toMatchObject({ startTick: PPQ, durationTicks: PPQ })
      expect(tree.durationTicks).toBe(PPQ * 2)
    })

    it('advances time through gaps', () => {
      const result = compile(sequence(note('C4', '4n'), gap('4n'), note('E4', '4n')), config)
      const tree = result.tree as CompiledSequenceNode
      expect(tree.nodes[0]).toMatchObject({ startTick: 0 })
      expect(tree.nodes[1]).toMatchObject({ startTick: PPQ, type: 'gap' })
      expect(tree.nodes[2]).toMatchObject({ startTick: PPQ * 2 })
      expect(tree.durationTicks).toBe(PPQ * 3)
    })

    it('handles empty sequence', () => {
      const result = compile(sequence(), config)
      const tree = result.tree as CompiledSequenceNode
      expect(tree.durationTicks).toBe(0)
      expect(tree.nodes).toEqual([])
    })

    it('chains timing through nested sequences', () => {
      const inner = sequence(note('C4', '8n'), note('D4', '8n'))
      const result = compile(sequence(inner, note('E4', '4n')), config)
      const tree = result.tree as CompiledSequenceNode
      const innerCompiled = tree.nodes[0] as CompiledSequenceNode
      expect(innerCompiled.startTick).toBe(0)
      expect(innerCompiled.durationTicks).toBe(PPQ)
      expect(tree.nodes[1]).toMatchObject({ startTick: PPQ, durationTicks: PPQ })
      expect(tree.durationTicks).toBe(PPQ * 2)
    })
  })

  describe('layer', () => {
    it('gives all children the same startTick', () => {
      const result = compile(layer(note('C4', '4n'), note('E4', '4n')), config)
      const tree = result.tree as CompiledLayerNode
      expect(tree.nodes[0]).toMatchObject({ startTick: 0 })
      expect(tree.nodes[1]).toMatchObject({ startTick: 0 })
      expect(tree.durationTicks).toBe(PPQ)
    })

    it('uses longest child for duration', () => {
      const result = compile(layer(note('C4', '8n'), note('E4', '2n')), config)
      const tree = result.tree as CompiledLayerNode
      expect(tree.durationTicks).toBe(PPQ * 2)
    })

    it('uses duration override when set on node', () => {
      const layerNode = new LayerPattern([note('C4', '4n'), note('E4', '2n')], '1n')
      const result = compile(layerNode, config)
      const tree = result.tree as CompiledLayerNode
      expect(tree.durationTicks).toBe(PPQ * 4)
    })

    it('handles empty layer', () => {
      const result = compile(layer(), config)
      const tree = result.tree as CompiledLayerNode
      expect(tree.durationTicks).toBe(0)
      expect(tree.nodes).toEqual([])
    })
  })

  describe('repeat', () => {
    it('multiplies child duration by count', () => {
      const result = compile(repeat(note('C4', '4n'), 4), config)
      const tree = result.tree as CompiledRepeatNode
      expect(tree.durationTicks).toBe(PPQ * 4)
      expect(tree.count).toBe(4)
      expect(tree.node).toMatchObject({ startTick: 0, durationTicks: PPQ })
    })

    it('works with sequence child', () => {
      const phrase = sequence(note('C4', '8n'), note('D4', '8n'))
      const result = compile(repeat(phrase, 2), config)
      const tree = result.tree as CompiledRepeatNode
      expect(tree.durationTicks).toBe(PPQ * 2)
      expect(tree.node).toMatchObject({ type: 'sequence', durationTicks: PPQ })
    })
  })

  describe('assign', () => {
    it('carries track name and compiles child', () => {
      const result = compile(assign(note('C4', '4n'), { track: 'bass' }), config)
      const tree = result.tree as CompiledAssignNode
      expect(tree.track).toBe('bass')
      expect(tree.durationTicks).toBe(PPQ)
      expect(tree.node).toMatchObject({ type: 'note', pitch: 60 })
    })

    it('carries instrument when provided', () => {
      const result = compile(
        assign(note('C4', '4n'), {
          track: 'bass',
          instrument: { path: './sounds/gm.sf2', bank: 0, preset: 33 },
        }),
        config,
      )
      const tree = result.tree as CompiledAssignNode
      expect(tree.instrument).toEqual({ path: './sounds/gm.sf2', bank: 0, preset: 33 })
    })

    it('omits instrument when not provided', () => {
      const result = compile(assign(note('C4', '4n'), { track: 'kick' }), config)
      const tree = result.tree as CompiledAssignNode
      expect(tree.instrument).toBeUndefined()
    })
  })

  describe('composition', () => {
    it('places layers sequentially in a sequence', () => {
      const layer1 = layer(note('C4', '4n'), note('E4', '4n'))
      const layer2 = layer(note('G4', '4n'), note('B4', '4n'))
      const result = compile(sequence(layer1, layer2), config)
      const tree = result.tree as CompiledSequenceNode
      expect(tree.nodes[0]).toMatchObject({ startTick: 0, durationTicks: PPQ })
      expect(tree.nodes[1]).toMatchObject({ startTick: PPQ, durationTicks: PPQ })
    })

    it('plays sequences in parallel within a layer', () => {
      const seq1 = sequence(note('C4', '4n'), note('D4', '4n'))
      const seq2 = sequence(note('E4', '8n'), note('F4', '8n'))
      const result = compile(layer(seq1, seq2), config)
      const tree = result.tree as CompiledLayerNode
      expect(tree.nodes[0]).toMatchObject({ startTick: 0, durationTicks: PPQ * 2 })
      expect(tree.nodes[1]).toMatchObject({ startTick: 0, durationTicks: PPQ })
      expect(tree.durationTicks).toBe(PPQ * 2)
    })

    it('compiles assign wrapping a sequence', () => {
      const phrase = sequence(note('C2', '8n'), gap('8n'), note('C2', '8n'))
      const result = compile(assign(phrase, { track: 'bass' }), config)
      const tree = result.tree as CompiledAssignNode
      expect(tree.track).toBe('bass')
      expect(tree.durationTicks).toBe(PPQ / 2 * 3)
      const inner = tree.node as CompiledSequenceNode
      expect(inner.nodes).toHaveLength(3)
    })

    it('compiles a full arrangement with correct total duration', () => {
      const kickHit = note('C1', '4n')
      const clapHit = note('D1', '4n')
      const kickPattern = repeat(kickHit, 4)
      const clapPattern = sequence(gap('4n'), clapHit, gap('4n'), clapHit)

      const kickTrack = assign(kickPattern, { track: 'kick' })
      const clapTrack = assign(clapPattern, { track: 'clap' })

      const groove = layer(kickTrack, clapTrack)
      const arrangement = sequence(repeat(groove, 2), repeat(groove, 2))

      const result = compile(arrangement, { tempo: 126, key: 'Cm', timeSignature: [4, 4] })
      const barTicks = PPQ * 4
      // groove = 1 bar, repeat(groove, 2) = 2 bars, sequence of two = 4 bars
      expect(result.durationTicks).toBe(barTicks * 4)
    })
  })

  describe('config', () => {
    it('carries tempo, key, timeSignature, and ppq', () => {
      const result = compile(note('C4', '4n'), { tempo: 140, key: 'Dm', timeSignature: [3, 4] })
      expect(result.tempo).toBe(140)
      expect(result.key).toBe('Dm')
      expect(result.timeSignature).toEqual([3, 4])
      expect(result.ppq).toBe(480)
    })

    it('sets durationTicks from the root tree', () => {
      const result = compile(sequence(note('C4', '4n'), note('D4', '4n')), config)
      expect(result.durationTicks).toBe(PPQ * 2)
    })
  })
})
