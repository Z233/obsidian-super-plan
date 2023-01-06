import { Activity, ActivityData } from "./types";
import { parseMins2Time, parseTime2Mins } from "./utils/helper";
import { schedule } from "./utils/schedule";

export class Plan {
	private activitiesData: ActivityData[];

	constructor(activitiesData: ActivityData[]) {
		this.activitiesData = activitiesData;
	}

	schedule() {
		const duration = this.getDurationMins(this.activitiesData);
		const scheduledActivities = schedule(
			duration,
			this.convertData(this.activitiesData)
		);
		return this.generateData(scheduledActivities);
	}

	private getDurationMins(activitiesData: ActivityData[]) {
		const startMins = parseTime2Mins(activitiesData[0].start);
		const endMins = parseTime2Mins(
			activitiesData[activitiesData.length - 1].start
		);
		return endMins - startMins;
	}

	private convertData(activitiesData: ActivityData[]): Activity[] {
		return activitiesData.map((data) => {
			const startMins = parseTime2Mins(data.start);
			return {
				activity: data.activity,
				length: data.length,
				start: startMins,
				stop: startMins + data.actLen,
				isFixed: data.f,
				isRound: data.r,
				actLen: data.actLen,
			};
		});
	}

	private generateData(activities: Activity[]): ActivityData[] {
		return activities.map((a) => ({
			activity: a.activity,
			length: a.length,
			start: parseMins2Time(a.start),
			f: a.isFixed,
			r: a.isRound,
			actLen: a.actLen,
		}));
	}
}
