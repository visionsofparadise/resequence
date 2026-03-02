import { ShowOpenDialogMainIpc } from "./Dialog/showOpenDialog/Main";
import { EnsureDirectoryMainIpc } from "./FileSystem/ensureDirectory/Main";
import { ReadFileMainIpc } from "./FileSystem/readFile/Main";
import { ReadFileBufferMainIpc } from "./FileSystem/readFileBuffer/Main";
import { ReadFileChunkMainIpc } from "./FileSystem/readFileChunk/Main";
import { StatMainIpc } from "./FileSystem/stat/Main";
import { WriteFileMainIpc } from "./FileSystem/writeFile/Main";
import { GetAppVersionMainIpc } from "./System/getAppVersion/Main";
import { GetUserDataPathMainIpc } from "./System/getUserDataPath/Main";
import { GetWindowIdMainIpc } from "./System/getWindowId/Main";

export const ASYNC_MAIN_IPCS = [
	EnsureDirectoryMainIpc,
	ReadFileMainIpc,
	ReadFileBufferMainIpc,
	ReadFileChunkMainIpc,
	StatMainIpc,
	WriteFileMainIpc,
	ShowOpenDialogMainIpc,
	GetUserDataPathMainIpc,
	GetWindowIdMainIpc,
	GetAppVersionMainIpc,
];
