import type {
	Activities,
	ActivitiesData,
	Activity,
	ActivityData,
} from "./types";
import {
	parseMins2Time,
	parseMins2TodayUnix,
	parseTime2Mins,
} from "./utils/helper";
import { schedule } from "./utils/schedule";

export class Plan {
	activities: Activities;
	private readonly startMins: number;
	private endMins: number;
	readonly startUnix: number;
	readonly endUnix: number;

	constructor(activitiesData: ActivityData[]) {
		this.activities = this.convertData(activitiesData);

		this.startMins = this.activities[0].start;
		this.endMins = this.activities[this.activities.length - 1].start;

		this.startUnix = parseMins2TodayUnix(this.startMins);
		this.endUnix = parseMins2TodayUnix(this.endMins);

		this.schedule();
	}

	schedule() {
		const duration = this.endMins - this.startMins;
		const scheduledActivities = schedule(duration, this.activities);
		this.activities = scheduledActivities;
	}

	update(index: number, activity: Activity) {
		const origin = this.activities[index];
		if (!origin) return;
		this.activities[index] = activity;
	}

	getData() {
		return this.generateData(this.activities);
	}

	private convertData(activitiesData: ActivityData[]): Activities {
		const activities: Activities = [];
		let offsetCount = 0;
		for (let i = 0; i < activitiesData.length; i++) {
			const data = activitiesData[i];

			const actLen = +data.actLen;
			const isFixed = this.check(data.f);

			let startMins = parseTime2Mins(data.start) + offsetCount * 24 * 60;

			if (i > 0 && activities[i - 1].start > startMins) {
				offsetCount++;
				startMins += offsetCount * 24 * 60;
			}

			activities.push({
				activity: data.activity,
				length: +data.length,
				start: startMins,
				stop: 0,
				isFixed,
				isRound: this.check(data.r),
				actLen: actLen,
			});
		}

		return activities;
	}

	private check(value: string) {
		return value === "x" ? true : false;
	}

	private generateData(activities: Activity[]): ActivitiesData {
		return activities.map((a) => ({
			activity: a.activity,
			length: a.length.toString(),
			start: parseMins2Time(a.start),
			f: a.isFixed ? "x" : "",
			r: a.isRound ? "x" : "",
			actLen: a.actLen.toString(),
		}));
	}
}
