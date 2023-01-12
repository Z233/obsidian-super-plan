import { Plan } from "./plan";
import { timer } from "./timer";
import type { ActivitiesData, Activity, Maybe, PlanTableInfo } from "./types";
import { getNowMins } from "./utils/helper";
import StatusBar from "./components/StatusBar.svelte";
import type { Parser } from "./parser";
import { Point } from "@tgrosinger/md-advanced-tables";
import type { PlanFile } from "./plan-file";
import type { SuperPlanSettings } from "./settings";
import moment from "moment";
import { findLastIndex, isEqual } from "lodash-es";
import type { App, Workspace } from "obsidian";
import { PlanEditor } from "./plan-editor";

type StatusBarProps = StatusBar["$$prop_def"];

export class PlanTracker {
	private readonly statusBarEl: HTMLElement;
	private readonly parser: Parser;
	private readonly file: PlanFile;
	private readonly settings: SuperPlanSettings;
	private readonly app: App;

	private plan: Maybe<Plan>;
	private tableInfo: Maybe<PlanTableInfo>;

	private statusBarComp: StatusBar;

	private prev: Maybe<Activity>;
	private now: Maybe<Activity>;
	private next: Maybe<Activity>;

	private lastSendNotificationActivity: Maybe<Activity>;

	constructor(
		app: App,
		parser: Parser,
		file: PlanFile,
		settings: SuperPlanSettings,
		statusBar: HTMLElement
	) {
		this.app = app;
		this.parser = parser;
		this.file = file;
		this.settings = settings;
		this.statusBarEl = statusBar;
	}

	init() {
		this.statusBarComp = new StatusBar({
			target: this.statusBarEl,
			props: {
				now: this.now,
				next: this.next,
				progressType: this.settings.progressType,
				jump2ActivityRow: this.jump2ActivityRow.bind(this),
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

	private updateStatusBar(props: StatusBarProps) {
		this.statusBarComp.$set(props);
	}
	private async jump2ActivityRow(activity: Activity) {
		if (!this.tableInfo || !this.plan) return;
		const { workspace } = this.app;

		const activityIndex = this.plan.activities.findIndex((a) =>
			isEqual(a, activity)
		);
		const rowIndex = activityIndex + 2;

		const leaf = workspace.getLeaf();
		const file = this.file.todayFile;

		if (file) {
			await leaf.openFile(file, { active: true });
			const editor = workspace.activeEditor!.editor!;

			const { range } = this.tableInfo;

			editor.setCursor(range.start.row + rowIndex, 3);
		}
	}

	private getStatusBarProps(): StatusBarProps {
		if (!this.plan)
			return {
				now: null,
				next: null,
				isAllDone: false
			};
		const nowMins = getNowMins();
		const nowIndex = findLastIndex(
			this.plan.activities,
			(a) => nowMins >= a.start && a.isFixed
		);
		const now = this.plan.activities[nowIndex];

		if (
			nowIndex === this.plan.activities.length - 1 &&
			nowMins >= now.stop
		) {
			return {
				now,
				next: null,
				isAllDone: true,
			};
		}

		const durationMins = nowMins - now.start;
		const durationSecs = durationMins * 60 + new Date().getSeconds();
		const totalMins = now.actLen;
		const totalSecs = totalMins * 60;
		const progress = (durationSecs / totalSecs) * 100;

		const next = this.plan.activities[nowIndex + 1];

		return {
			now,
			next,
			progress: progress <= 100 ? progress : 100,
			leftMins: totalMins - durationMins,
			isAllDone: false,
		};
	}

	private async onTick() {
		if (!this.plan) return;

		const props = this.getStatusBarProps();
		this.updateStatusBar(props);

		const { now } = props;

		if (!isEqual(now, this.now)) {
			this.prev = this.now;
			this.now = now;
		}

		const nowMins = getNowMins();

		if (
			this.prev &&
			this.now &&
			nowMins >= this.now.stop &&
			this.lastSendNotificationActivity !== this.now
		) {
			new Notification("Time to start next activity!");
			this.lastSendNotificationActivity = this.now;

			// TODO: Jump to next activity row
			// notification.addEventListener("click", () => {});
		}
	}

	setData(
		activitiesData: Maybe<ActivitiesData>,
		tableInfo: Maybe<PlanTableInfo>
	) {
		this.plan = activitiesData ? new Plan(activitiesData) : null;
		this.tableInfo = tableInfo;
		this.updateStatusBar(this.getStatusBarProps());
	}
}
