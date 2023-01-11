import { Plan } from "./plan";
import { timer } from "./timer";
import type { ActivitiesData, Activity, Maybe } from "./types";
import { getNowMins } from "./utils/helper";
import StatusBar from "./components/StatusBar.svelte";
import type { Parser } from "./parser";
import type { Table } from "@tgrosinger/md-advanced-tables";
import type { PlanFile } from "./plan-file";
import type { SuperPlanSettings } from "./settings";
import moment from "moment";

export class PlanTracker {
	private readonly statusBarContainer: HTMLElement;
	private readonly parser: Parser;
	private readonly file: PlanFile;
	private readonly settings: SuperPlanSettings;

	private plan: Maybe<Plan>;
	private table: Maybe<Table>;

	private statusBarComp: StatusBar;

	private now: Maybe<Activity>;
	private next: Maybe<Activity>;

	constructor(
		parser: Parser,
		file: PlanFile,
		settings: SuperPlanSettings,
		statusBar: HTMLElement
	) {
		this.parser = parser;
		this.file = file;
		this.settings = settings;
		this.statusBarContainer = statusBar;
	}

	init() {
		this.statusBarComp = new StatusBar({
			target: this.statusBarContainer,
			props: {
				now: this.now,
				next: this.next,
				progressType: this.settings.progressType,
			},
		});

		this.settings.onUpdate((options) => {
			if (options["progressType"]) {
				this.statusBarComp.$set({
					progressType: options.progressType,
				});
			}
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
		if (!now) {
			const nowUnix = moment().unix();

			if (nowUnix > this.plan.endUnix) {
				this.statusBarComp.$set({
					now: null,
					next: null,
					isAllDone: true,
				});
				return;
			}
			return;
		}

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

		const durationMins = nowMins - now.start;
		const durationSecs = durationMins * 60 + new Date().getSeconds();
		const totalMins = now.actLen;
		const totalSecs = totalMins * 60;
		const progress = (durationSecs / totalSecs) * 100;

		const next = this.plan.activities[nowIndex + 1];

		this.statusBarComp.$set({
			now,
			next,
			progress,
			leftMins: totalMins - durationMins,
			isAllDone: false,
		});
	}

	setData(activitiesData: ActivitiesData, table: Table) {
		this.plan = new Plan(activitiesData);
		this.table = table;
	}
}
