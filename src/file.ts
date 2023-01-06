import { Vault, normalizePath } from "obsidian";
import { EventEmitter } from "events";

const DEFAULT_FILE = "super-plan.md";

export class PlanFile extends EventEmitter {
	vault: Vault;

	constructor(vault: Vault) {
		super();
		this.vault = vault;
		this.vault.on("modify", (file) => {
			if (file.path === DEFAULT_FILE) {
				this.emit("modify");
			}
		});
	}

	getFilePath() {
		return DEFAULT_FILE;
	}

	async getFileContent() {
		return this.vault.adapter.read(DEFAULT_FILE);
	}

	async updateFile(fileName: string, fileContents: string) {
		try {
			return await this.vault.adapter.write(
				normalizePath(fileName),
				fileContents
			);
		} catch (error) {
			console.log(error);
		}
	}
}
