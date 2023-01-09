import { isEqual } from "lodash-es";
import { Plan } from "./plan";
import { timer } from "./timer";
import { ActivitiesData, Activity, Maybe } from "./types";
import { getNowMins } from "./utils/helper";

interface State {
	activity: Maybe<Activity>;
}

export class PlanTracker {
	private plan: Maybe<Plan>;
	private readonly bar: HTMLElement;
	private nowActivity: Maybe<Activity>;
	private nowActivityEl: HTMLElement;

	constructor(statusBar: HTMLElement) {
		this.bar = statusBar;
	}

	init() {
		const nowContainer = this.bar.createDiv({
			cls: "now-container",
		});

		nowContainer.createEl("strong", {
			text: "Now",
			prepend: true,
		});

		this.nowActivityEl = nowContainer.createSpan({
			text: "00:00 Coding",
		});

		timer.onTick(this.onTick.bind(this));
	}

	private onTick() {
		if (!this.plan) return;
		const nowMins = getNowMins();
		const active = this.plan.activities.find(
			(a) => nowMins >= a.start && nowMins < a.stop
		);
		if (isEqual(active, this.nowActivity)) {
			this.nowActivity = active;
			this.onActivityChanged();
		}
	}

	private onActivityChanged() {}

	setData(activitiesData: ActivitiesData) {
		this.plan = new Plan(activitiesData);
	}
}
