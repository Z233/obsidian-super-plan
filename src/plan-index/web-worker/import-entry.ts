/** Entry-point script used by the index as a web worker. */
import { runImport } from "./import-impl";
import type { FileStats } from "obsidian";

/** An import which can fail and raise an exception, which will be caught by the handler. */
function failableImport(path: string, contents: string, stat: FileStats) {
    return runImport(path, contents, stat);
}

onmessage = async evt => {
    try {
        let { path, contents, stat } = evt.data;
        let result = failableImport(path, contents, stat);
        (postMessage as any)({ path: evt.data.path, result: result });
    } catch (error) {
        console.log(error);
        (postMessage as any)({
            path: evt.data.path,
            result: {
                $error: `Failed to index file: ${evt.data.path}: ${error}`,
            },
        });
    }
};
