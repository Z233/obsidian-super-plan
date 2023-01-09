import { isEqual } from "lodash-es";
import { Plan } from "./plan";
import { timer } from "./timer";
import type { ActivitiesData, Activity, Maybe } from "./types";
import { getNowMins } from "./utils/helper";
import StatusBar from "./components/StatusBar.svelte";

export class PlanTracker {
	private plan: Maybe<Plan>;
	private readonly statusBarContainer: HTMLElement;
	private statusBarComp: StatusBar;

	private now: Maybe<Activity>;
	private next: Maybe<Activity>;

	constructor(statusBar: HTMLElement) {
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

	private onTick() {
		if (!this.plan) return;
		const nowMins = getNowMins();

		const nowIndex = this.plan.activities.findIndex(
			(a) => nowMins >= a.start && nowMins < a.stop
		);
		const now = this.plan.activities[nowIndex];
		const next = this.plan.activities[nowIndex + 1];

		this.statusBarComp.$set({
			now,
			next,
		});
	}

	setData(activitiesData: ActivitiesData) {
		this.plan = new Plan(activitiesData);
	}
}
