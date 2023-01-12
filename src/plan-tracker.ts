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
import { findLastIndex, isEqual } from "lodash-es";

type StatusBarProps = StatusBar["$$prop_def"];

export class PlanTracker {
	private readonly statusBarContainer: HTMLElement;
	private readonly parser: Parser;
	private readonly file: PlanFile;
	private readonly settings: SuperPlanSettings;

	private plan: Maybe<Plan>;
	private table: Maybe<Table>;

	private statusBarComp: StatusBar;

	private prev: Maybe<Activity>;
	private now: Maybe<Activity>;
	private next: Maybe<Activity>;

	private lastSendNotificationActivity: Maybe<Activity>;

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

	private updateStatusBar(props: StatusBarProps) {
		this.statusBarComp.$set(props);
	}

	private getStatusBarProps(): StatusBarProps {
		if (!this.plan)
			return {
				now: null,
				next: null,
			};
		const nowMins = getNowMins();
		const nowIndex = findLastIndex(
			this.plan.activities,
			(a) => nowMins >= a.start && a.isFixed
		);
		const now = this.plan.activities[nowIndex];

		if (!now) {
			const nowUnix = moment().unix();

			return {
				now: null,
				next: null,
				isAllDone: nowUnix > this.plan.endUnix,
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

	setData(activitiesData: ActivitiesData, table: Table) {
		this.plan = new Plan(activitiesData);
		this.table = table;
		this.updateStatusBar(this.getStatusBarProps());
	}
}
