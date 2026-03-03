import { ShowOpenDialogMainIpc } from "./Dialog/showOpenDialog/Main";
import { EnsureDirectoryMainIpc } from "./FileSystem/ensureDirectory/Main";
import { ReadDirectoryMainIpc } from "./FileSystem/readDirectory/Main";
import { ReadFileMainIpc } from "./FileSystem/readFile/Main";
import { ReadFileBufferMainIpc } from "./FileSystem/readFileBuffer/Main";
import { ReadFileChunkMainIpc } from "./FileSystem/readFileChunk/Main";
import { StatMainIpc } from "./FileSystem/stat/Main";
import { WriteFileMainIpc } from "./FileSystem/writeFile/Main";
import { BundleProjectMainIpc } from "./Project/bundleProject/Main";
import { CloseWatcherMainIpc } from "./Project/closeWatcher/Main";
import { OpenWatcherMainIpc } from "./Project/openWatcher/Main";
import { GetAppVersionMainIpc } from "./System/getAppVersion/Main";
import { GetUserDataPathMainIpc } from "./System/getUserDataPath/Main";
import { GetWindowIdMainIpc } from "./System/getWindowId/Main";

export const ASYNC_MAIN_IPCS = [
	EnsureDirectoryMainIpc,
	ReadDirectoryMainIpc,
	ReadFileMainIpc,
	ReadFileBufferMainIpc,
	ReadFileChunkMainIpc,
	StatMainIpc,
	WriteFileMainIpc,
	ShowOpenDialogMainIpc,
	BundleProjectMainIpc,
	CloseWatcherMainIpc,
	OpenWatcherMainIpc,
	GetUserDataPathMainIpc,
	GetWindowIdMainIpc,
	GetAppVersionMainIpc,
];
