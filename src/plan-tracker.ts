import { Plan } from "./plan";
import { timer } from "./timer";
import type { ActivitiesData, Activity, Maybe } from "./types";
import { getNowMins } from "./utils/helper";
import StatusBar from "./components/StatusBar.svelte";
import type { Parser } from "./parser";
import type { Table } from "@tgrosinger/md-advanced-tables";
import type { PlanFile } from "./plan-file";

export class PlanTracker {
	private readonly statusBarContainer: HTMLElement;
	private readonly parser: Parser;
	private readonly file: PlanFile;

	private plan: Maybe<Plan>;
	private table: Maybe<Table>;

	private statusBarComp: StatusBar;

	private now: Maybe<Activity>;
	private next: Maybe<Activity>;

	constructor(parser: Parser, file: PlanFile, statusBar: HTMLElement) {
		this.parser = parser;
		this.file = file;
		this.statusBarContainer = statusBar;
	}

	init() {
		this.statusBarComp = new StatusBar({
			target: this.statusBarContainer,
			props: {
				now: this.now,
				next: this.next,
			},
		});

		timer.onTick(this.onTick.bind(this));
	}

	private async onTick() {
		if (!this.plan) return;
		const nowMins = getNowMins();

		const nowIndex = this.plan.activities.findIndex(
			(a) => nowMins >= a.start && nowMins < a.stop
		);
		const now = this.plan.activities[nowIndex];
		if (!now) return;

		if (!now.isFixed && this.table) {
			this.plan.update(nowIndex, {
				...now,
				isFixed: true,
			});

			const newTable = this.parser.transformActivitiesData(
				this.plan.getData()
			);

			const content = await this.file.getTodayPlanFileContent();
			const updatedContent = content.replace(
				this.table.toLines().join("\n"),
				newTable.toLines().join("\n")
			);

			this.file.updateTodayPlanFile(updatedContent);
		}

		const durationSecs =
			(nowMins - now.start) * 60 + new Date().getSeconds();
		const totalSecs = now.actLen * 60;
		const progress = (durationSecs / totalSecs) * 100;

		const next = this.plan.activities[nowIndex + 1];

		this.statusBarComp.$set({
			now,
			next,
			progress,
		});
	}

	setData(activitiesData: ActivitiesData, table: Table) {
		this.plan = new Plan(activitiesData);
		this.table = table;
	}
}
