import { readTable } from "@tgrosinger/md-advanced-tables";
import { _createIsTableRowRegex } from "@tgrosinger/md-advanced-tables/lib/table-editor";
import { Vault } from "obsidian";
import { Parser } from "./parser";
import { SuperPlanSettings } from "./settings";

const DEFAULT_FILE = "super-plan.md";

export class PlanFileManager {
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

}
