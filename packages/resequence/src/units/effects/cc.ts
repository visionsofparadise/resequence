import type { ScheduleContext } from "../../rendering/schedule-context";
import type { VoiceNote } from "../midi-unit";
import { MidiUnit } from "../midi-unit";
import { envelope, type EnvelopeUnit } from "../midi/envelope";
import type { SetupResult, Unit } from "../unit";
import { chorus } from "./chorus";
import { lowpass, type FilterEffectUnit } from "./filter";
import { gain, linearGain, type GainEffectUnit } from "./gain";
import { mix, type MixNode } from "./mix";
import { pan, type PanEffectUnit } from "./pan";
import { reverb } from "./reverb";

export class CCEffectUnit extends MidiUnit {
	public chain: Array<Unit> = [];
	public envelopeUnit: EnvelopeUnit | undefined;
	public filterUnit: FilterEffectUnit | undefined;
	public volumeUnit: GainEffectUnit | undefined;
	public chorusUnit: MixNode | undefined;
	public panUnit: PanEffectUnit | undefined;
	public reverbUnit: MixNode | undefined;

	constructor(private readonly voiceNote: VoiceNote) {
		super();
	}

	protected _setup(_context: ScheduleContext): SetupResult {
		const units: Array<Unit> = [];

		const { attack, release, sustain } = this.voiceNote;

		if (attack !== undefined || release !== undefined || sustain !== undefined) {
			const sustainOn = sustain !== undefined && sustain >= 64;
			const attackMs = attack !== undefined ? (attack / 127) * 2000 : 0;
			const releaseMs = release !== undefined && !sustainOn ? (release / 127) * 4000 : 0;

			const envelopeUnit = envelope({
				attack: attackMs,
				decay: 0,
				sustain: 1,
				release: releaseMs,
			});

			this.envelopeUnit = envelopeUnit;
			units.push(envelopeUnit);
		}

		const { cutoff, resonance } = this.voiceNote;

		if (cutoff !== undefined || resonance !== undefined) {
			const cutoffFrequency = cutoff !== undefined ? 20 * Math.pow(1000, cutoff / 127) : 1000;
			const filterResonance = resonance !== undefined ? (resonance / 127) * 20 : undefined;
			const filterUnit = lowpass({ frequency: cutoffFrequency, resonance: filterResonance });
			this.filterUnit = filterUnit;
			units.push(filterUnit);
		}

		const { volume, expression } = this.voiceNote;

		if (volume !== undefined || expression !== undefined) {
			const linear = (volume !== undefined ? volume / 127 : 1) * (expression !== undefined ? expression / 127 : 1);
			const volumeUnit = gain({ level: linearToDecibels(linear) });
			this.volumeUnit = volumeUnit;
			units.push(volumeUnit);
		}

		const { chorus: chorusAmount } = this.voiceNote;

		if (chorusAmount !== undefined && chorusAmount > 0) {
			const chorusUnit = mix(chorus({ rate: 0.5, depth: 0.005 }), chorusAmount / 127);
			this.chorusUnit = chorusUnit;
			units.push(chorusUnit);
		}

		const { pan: panValue } = this.voiceNote;

		if (panValue !== undefined) {
			const panUnit = pan({ position: (panValue / 127) * 2 - 1 });
			this.panUnit = panUnit;
			units.push(panUnit);
		}

		const { reverb: reverbAmount } = this.voiceNote;

		if (reverbAmount !== undefined && reverbAmount > 0) {
			const reverbUnit = mix(reverb({ roomSize: 0.8, damping: 0.5 }), reverbAmount / 127);
			this.reverbUnit = reverbUnit;
			units.push(reverbUnit);
		}

		if (units.length === 0) {
			units.push(linearGain({ level: 1 }));
		}

		for (let index = 0; index < units.length - 1; index++) {
			const current = units[index];
			const next = units[index + 1];
			if (current && next) current.to(next);
		}

		const firstUnit = units[0];
		const lastUnit = units[units.length - 1];

		this.chain = units;

		if (firstUnit && lastUnit) {
			return { entries: [firstUnit], exits: [lastUnit] };
		}

		return {};
	}

	protected _teardown(context: ScheduleContext): void {
		this.chain[0]?.teardown(context);
		this.chain = [];

		this.envelopeUnit = undefined;
		this.filterUnit = undefined;
		this.volumeUnit = undefined;
		this.chorusUnit = undefined;
		this.panUnit = undefined;
		this.reverbUnit = undefined;
	}

	protected _schedule(voiceNote: VoiceNote, scheduleContext: ScheduleContext): void {
		this.envelopeUnit?.schedule(voiceNote, scheduleContext);
	}
}

function linearToDecibels(linear: number): number {
	return 20 * Math.log10(Math.max(linear, 1e-5));
}
