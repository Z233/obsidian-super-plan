import { PlanFile } from "./file";
import { Parser } from "./parser";
import { Plan } from "./plan";

export class PlansMarkdown {
	file: PlanFile;
	parser: Parser;

	constructor(file: PlanFile, parser: Parser) {
		this.file = file;
		this.parser = parser;
	}

	async parsePlanMds() {
		const mdContent = await this.file.getFileContent();
		return this.parser.parseMarkdown(mdContent);
	}

	async update(origin: string, target: string) {
		const fileContent = await this.file.getFileContent();
		const fileContentUpdated = fileContent.replace(origin, target);
		this.file.updateFile(this.file.getFilePath(), fileContentUpdated);
		console.log("[SuperPlan]:", "file updated");
		console.log(origin)
		console.log(target)
	}
}
