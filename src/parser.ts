import { ActivityData } from "./types";

const PLAN_TABLE_PATTERN = `\\|\\s*\\*\\*Activity\\*\\*\\s*\\|\\s*\\*\\*Length\\*\\*\\s*\\|\\s*\\*\\*Start\\*\\*\\s*\\|\\s*\\*\\*F\\*\\*\\s*\\|\\s*\\*\\*R\\*\\*\\s*\\|\\s*\\*\\*ActLen\\*\\*\\s*\\|[\\s\\S]*?END\\s*\\|\\s*0\\s*\\|[\\s\\S]*?\\|\\s*x\\s*\\|\\s*\\|\\s*0\\s*\\|`;

export class Parser {
	parseMarkdown(mdContent: string) {
		const ret: string[] = [];
		const re = new RegExp(PLAN_TABLE_PATTERN, "gm");
		let match;
		while ((match = re.exec(mdContent)) !== null) {
			if (match.index === re.lastIndex) {
				re.lastIndex++;
			}

			const planTableMd = match[0];
			ret.push(planTableMd);
		}
		return ret;
	}

	private parseTableMarkdown(tableMdContent: string): ActivityData[] {
		const rows = tableMdContent
			.split("\n")
			.slice(2)
			.filter((row) => row.trim() !== "");

		const data = rows.map((row) => {
			const [activity, length, start, f, r, actLen] = row
				.split("|")
				.slice(1, -1)
				.map((cell) => cell.trim());
			return {
				activity,
				length,
				start,
				f,
				r,
				actLen,
			} as ActivityData;
		});

		return data;
	}
}
