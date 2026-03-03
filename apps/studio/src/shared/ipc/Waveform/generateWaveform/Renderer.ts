import { AsyncRendererIpc } from "../../../models/AsyncRendererIpc";

export type GenerateWaveformIpcParameters = [absolutePath: string];
export type GenerateWaveformIpcReturn = Uint8Array;
export const GENERATE_WAVEFORM_ACTION = "generateWaveform" as const;

export class GenerateWaveformRendererIpc extends AsyncRendererIpc<typeof GENERATE_WAVEFORM_ACTION, GenerateWaveformIpcParameters, GenerateWaveformIpcReturn> {
	action = GENERATE_WAVEFORM_ACTION;
}
