import { bundleEntrypoint } from "../../../../main/bundleEntrypoint";
import { AsyncMainIpc, type IpcHandlerDependencies } from "../../../models/AsyncMainIpc";
import { BUNDLE_PROJECT_ACTION, type BundleProjectIpcParameters, type BundleProjectIpcReturn } from "./Renderer";

export class BundleProjectMainIpc extends AsyncMainIpc<BundleProjectIpcParameters, BundleProjectIpcReturn> {
	action = BUNDLE_PROJECT_ACTION;

	async handler(entrypoint: string, _dependencies: IpcHandlerDependencies): Promise<BundleProjectIpcReturn> {
		return bundleEntrypoint(entrypoint);
	}
}
