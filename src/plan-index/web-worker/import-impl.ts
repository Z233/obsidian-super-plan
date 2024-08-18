/** Actual import implementation backend. This must remain separate from `import-entry` since it is used without web workers. */
import type { FileStats } from "obsidian";
import { parsePagePlanData } from "src/plan-import/file-markdown";

export function runImport(
    path: string,
    contents: string,
    stats: FileStats
): Partial<unknown> {
    return parsePagePlanData(path, contents, stats)
}