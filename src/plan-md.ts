import { Plan } from "./plan";
import { PlansMarkdown } from "./plans-md";
import { ActivityData } from "./types";
import { getMarkdownTableHeader } from "./utils/helper";

export class PlanMarkdown {
	private plansMd: PlansMarkdown;
	private markdown: string;
	private plan: Plan;

	constructor(markdown: string, plansMd: PlansMarkdown) {
		this.markdown = markdown;
		this.plansMd = plansMd;

		const activities = this.convertMarkdown(this.markdown);
		this.plan = new Plan(activities);
	}

	schedule() {
		const activities = this.plan.schedule();
		const tableMd = this.generateMarkdown(activities);
		if (this.compare(tableMd, this.markdown)) {
			this.plansMd.update(this.markdown, tableMd);
		}
	}

	private compare(a: string, b: string) {
		const re = /\s/gm;
		return a.replace(re, "").localeCompare(b.replace(re, ""));
	}

	private convertMarkdown(markdown: string): ActivityData[] {
		const rows = markdown
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
				length: Number(length),
				start,
				f: f === "x",
				r: r === "x",
				actLen: Number(actLen),
			} as ActivityData;
		});

		return data;
	}

	private generateMarkdown(activities: ActivityData[]) {
		const table = `${getMarkdownTableHeader()}
${activities
	.map(
		(a) =>
			`| ${a.activity} | ${a.length} | ${a.start} | ${
				a.f ? "x" : " "
			} | ${a.r ? "x" : " "} | ${a.actLen} |`
	)
	.join("\n")}
`;

		return table;
	}
}
