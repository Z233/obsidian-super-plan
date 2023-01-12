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
		this.endMins = parseTime2Mins(
			activitiesData[activitiesData.length - 1].start
		);
		this.activities = this.convertData(activitiesData);

		this.startMins = this.activities[0].start;
		this.startUnix = parseMins2TodayUnix(this.startMins);
		this.endUnix = parseMins2TodayUnix(this.endMins);
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

	private delayEndMins(mins: number) {
		const dayMins = 24 * 60;
		this.endMins += dayMins;
		return mins + dayMins;
	}

	private convertData(activitiesData: ActivityData[]): Activities {
		const activities: Activities = [];
		for (let i = 0; i < activitiesData.length; i++) {
			const data = activitiesData[i];
			const prev = activities[i - 1];

			const startMins =
				i === activitiesData.length - 1
					? this.endMins
					: parseTime2Mins(data.start);

			const actLen = +data.actLen;
			const isFixed = this.check(data.f);

			activities.push({
				activity: data.activity,
				length: +data.length,
				start:
					startMins < ~~prev?.start && isFixed
						? this.delayEndMins(startMins)
						: startMins,
				stop: startMins + actLen,
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
