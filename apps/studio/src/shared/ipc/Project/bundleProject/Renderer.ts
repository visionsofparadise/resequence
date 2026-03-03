import { AsyncRendererIpc } from "../../../models/AsyncRendererIpc";

export type BundleProjectIpcParameters = [entrypoint: string];
export type BundleProjectIpcReturn = string;
export const BUNDLE_PROJECT_ACTION = "bundleProject" as const;

export class BundleProjectRendererIpc extends AsyncRendererIpc<typeof BUNDLE_PROJECT_ACTION, BundleProjectIpcParameters, BundleProjectIpcReturn> {
	action = BUNDLE_PROJECT_ACTION;
}
