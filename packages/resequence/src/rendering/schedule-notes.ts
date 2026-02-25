import type { Midi, Node, NoteContext } from "../nodes/node";
import type { PositionedNote } from "../patterns/pattern";
import { CC } from "../utils/cc";
import type { ScheduleContext } from "./schedule-context";
import { ticksToSeconds } from "./tempo-map";

export function isInScope(offsetTicks: number, durationTicks: number, context: ScheduleContext): boolean {
	return offsetTicks + durationTicks > context.fromTicks && offsetTicks < context.toTicks;
}

export function prepareNotes(notes: ReadonlyArray<PositionedNote>, offsetTicks: number, outputs: ReadonlyArray<Node<Midi, ReadonlyArray<unknown>>>, scheduleContext: ScheduleContext): void {
	if (outputs.length === 0) return;

	for (const positioned of notes) {
		const noteTick = offsetTicks + positioned.tick;
		const noteEnd = noteTick + (positioned.durationTicks ?? 0);

		if (noteEnd <= scheduleContext.fromTicks || noteTick >= scheduleContext.toTicks) continue;

		const noteContext = buildNoteContext(positioned, noteTick, scheduleContext);

		for (const node of outputs) {
			node.prepare(noteContext, scheduleContext);
		}
	}
}

export function scheduleNotes(notes: ReadonlyArray<PositionedNote>, offsetTicks: number, outputs: ReadonlyArray<Node<Midi, ReadonlyArray<unknown>>>, scheduleContext: ScheduleContext): void {
	if (outputs.length === 0) return;

	for (const positioned of notes) {
		const noteTick = offsetTicks + positioned.tick;
		const noteEnd = noteTick + (positioned.durationTicks ?? 0);

		if (noteEnd <= scheduleContext.fromTicks || noteTick >= scheduleContext.toTicks) continue;

		const noteContext = buildNoteContext(positioned, noteTick, scheduleContext);

		for (const node of outputs) {
			node.schedule(noteContext, scheduleContext);
		}
	}
}

function buildNoteContext(note: PositionedNote, absoluteTick: number, scheduleContext: ScheduleContext): NoteContext {
	const startTime = ticksToSeconds(absoluteTick, scheduleContext.tempoMap);
	const stopTime = ticksToSeconds(absoluteTick + (note.durationTicks ?? 0), scheduleContext.tempoMap);

	const sustainOn = note.cc?.[CC.SUSTAIN] !== undefined && (note.cc[CC.SUSTAIN] ?? 0) >= 64;
	const releaseSeconds = !sustainOn && note.cc?.[CC.RELEASE] !== undefined ? ((note.cc[CC.RELEASE] ?? 0) / 127) * 4 : 0;

	return {
		frequency: midiToFrequency(note.pitch),
		velocity: note.velocity ?? 100,
		startTime,
		stopTime,
		cleanupTime: stopTime + releaseSeconds + 0.5,
		cc: note.cc,
	};
}

function midiToFrequency(midi: number): number {
	return 440 * 2 ** ((midi - 69) / 12);
}

function createReverbIR(audioContext: BaseAudioContext, durationSeconds: number, decay: number): AudioBuffer {
	const sampleRate = audioContext.sampleRate;
	const length = Math.floor(sampleRate * durationSeconds);
	const buffer = audioContext.createBuffer(2, length, sampleRate);

	for (let channel = 0; channel < 2; channel++) {
		const channelData = buffer.getChannelData(channel);

		for (let sampleIndex = 0; sampleIndex < length; sampleIndex++) {
			channelData[sampleIndex] = (Math.random() * 2 - 1) * Math.pow(1 - sampleIndex / length, decay);
		}
	}

	return buffer;
}

export function applyCC(audio: AudioNode, cc: Partial<Record<number, number>> | undefined, noteContext: NoteContext, scheduleContext: ScheduleContext): { node: AudioNode; cleanup: () => void } {
	if (!cc) return { node: audio, cleanup: () => undefined };

	const nodes: Array<AudioNode> = [];

	let current: AudioNode = audio;

	const attack = cc[CC.ATTACK];
	const release = cc[CC.RELEASE];
	const sustain = cc[CC.SUSTAIN];
	const sustainOn = sustain !== undefined && sustain >= 64;

	if (attack !== undefined || (release !== undefined && !sustainOn)) {
		const envNode = scheduleContext.audioContext.createGain();
		const attackSeconds = attack !== undefined ? (attack / 127) * 2 : 0;
		const releaseSeconds = release !== undefined && !sustainOn ? (release / 127) * 4 : 0;

		if (attackSeconds > 0) {
			envNode.gain.setValueAtTime(0, noteContext.startTime);
			envNode.gain.linearRampToValueAtTime(1, noteContext.startTime + attackSeconds);
		} else {
			envNode.gain.setValueAtTime(1, noteContext.startTime);
		}

		if (releaseSeconds > 0) {
			envNode.gain.setValueAtTime(1, noteContext.stopTime);
			envNode.gain.linearRampToValueAtTime(0, noteContext.stopTime + releaseSeconds);
		}

		current.connect(envNode);
		nodes.push(envNode);
		current = envNode;
	}

	const cutoff = cc[CC.CUTOFF];
	const resonance = cc[CC.RESONANCE];

	if (cutoff !== undefined || resonance !== undefined) {
		const filterNode = scheduleContext.audioContext.createBiquadFilter();
		filterNode.type = "lowpass";

		if (cutoff !== undefined) {
			filterNode.frequency.value = 20 * Math.pow(1000, cutoff / 127);
		}

		if (resonance !== undefined) {
			filterNode.Q.value = (resonance / 127) * 20;
		}

		current.connect(filterNode);
		nodes.push(filterNode);
		current = filterNode;
	}

	const volume = cc[CC.VOLUME];
	const expression = cc[CC.EXPRESSION];

	if (volume !== undefined || expression !== undefined) {
		const gainNode = scheduleContext.audioContext.createGain();
		gainNode.gain.value = (volume !== undefined ? volume / 127 : 1) * (expression !== undefined ? expression / 127 : 1);
		current.connect(gainNode);
		nodes.push(gainNode);
		current = gainNode;
	}

	const chorusAmount = cc[CC.CHORUS];

	if (chorusAmount !== undefined && chorusAmount > 0) {
		const delayNode = scheduleContext.audioContext.createDelay(0.1);
		delayNode.delayTime.value = 0.015;

		const lfo = scheduleContext.audioContext.createOscillator();
		lfo.frequency.value = 0.5;

		const lfoGain = scheduleContext.audioContext.createGain();
		lfoGain.gain.value = 0.005;

		lfo.connect(lfoGain);
		lfoGain.connect(delayNode.delayTime);
		lfo.start(noteContext.startTime);
		lfo.stop(noteContext.cleanupTime);

		current.connect(delayNode);

		const chorusWetGain = scheduleContext.audioContext.createGain();
		chorusWetGain.gain.value = chorusAmount / 127;
		delayNode.connect(chorusWetGain);

		const chorusMerge = scheduleContext.audioContext.createGain();
		chorusMerge.gain.value = 1;
		current.connect(chorusMerge);
		chorusWetGain.connect(chorusMerge);

		nodes.push(delayNode, lfo, lfoGain, chorusWetGain, chorusMerge);
		current = chorusMerge;
	}

	const panValue = cc[CC.PAN];

	if (panValue !== undefined) {
		const pannerNode = scheduleContext.audioContext.createStereoPanner();
		pannerNode.pan.value = (panValue / 127) * 2 - 1;
		current.connect(pannerNode);
		nodes.push(pannerNode);
		current = pannerNode;
	}

	const reverbAmount = cc[CC.REVERB];

	if (reverbAmount !== undefined && reverbAmount > 0) {
		const existing = scheduleContext.nodeMap.get("__cc91_convolver");
		let convolver: ConvolverNode;

		if (existing instanceof ConvolverNode) {
			convolver = existing;
		} else {
			convolver = scheduleContext.audioContext.createConvolver();
			convolver.buffer = createReverbIR(scheduleContext.audioContext, 2, 3);
			scheduleContext.nodeMap.set("__cc91_convolver", convolver);
		}

		const wetGain = scheduleContext.audioContext.createGain();
		wetGain.gain.value = reverbAmount / 127;
		current.connect(convolver);
		convolver.connect(wetGain);

		const reverbMerge = scheduleContext.audioContext.createGain();
		reverbMerge.gain.value = 1;
		current.connect(reverbMerge);
		wetGain.connect(reverbMerge);

		nodes.push(wetGain, reverbMerge);
		current = reverbMerge;
	}

	// TODO: Discuss whether these should be resequence nodes, or need any other integration of clean up

	return {
		node: current,
		cleanup: () => {
			for (const node of nodes) node.disconnect();
		},
	};
}
