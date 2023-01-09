import type { Vault } from "obsidian";
import type { Parser } from "./parser";
import type { SuperPlanSettings } from "./settings";
import { _createIsTableRowRegex } from "@tgrosinger/md-advanced-tables/lib/table-editor";

const DEFAULT_FILE = "super-plan.md";

export class PlanFile {
	private readonly vault: Vault;
	private readonly parser: Parser;
	private readonly settings: SuperPlanSettings;

	constructor(vault: Vault, parser: Parser, settings: SuperPlanSettings) {
		this.vault = vault;
		this.parser = parser;
		this.settings = settings;
	}

	get todayPlanFilePath(): string {
		return DEFAULT_FILE;
	}

	getTodayPlanFileContent() {
		return this.vault.adapter.read(this.todayPlanFilePath);
	}

	async updateTodayPlanFile(content: string) {
		try {
			return await this.vault.adapter.write(
				this.todayPlanFilePath,
				content
			);
		} catch (error) {
			console.error(error);
		}
	}
}
