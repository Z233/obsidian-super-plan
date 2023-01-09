import type {
	Activities,
	ActivitiesData,
	Activity,
	ActivityData,
} from "./types";
import { parseMins2Time, parseTime2Mins } from "./utils/helper";
import { schedule } from "./utils/schedule";

export class Plan {
	activities: Activities;
	private readonly startMins: number;
	private readonly endMins: number;

	constructor(activitiesData: ActivityData[]) {
		this.startMins = parseTime2Mins(activitiesData[0].start);
		this.endMins = parseTime2Mins(
			activitiesData[activitiesData.length - 1].start
		);

		if (this.endMins < this.startMins) {
			this.endMins = this.endMins + 24 * 60;
		}

		this.activities = this.convertData(activitiesData);
	}

	schedule() {
		const duration = this.endMins - this.startMins;
		const scheduledActivities = schedule(duration, this.activities);
		this.activities = scheduledActivities;
	}

	getData() {
		return this.generateData(this.activities);
	}

	private convertData(activitiesData: ActivityData[]): Activities {
		return activitiesData.map((data, i) => {
			const startMins =
				i === activitiesData.length - 1
					? this.endMins
					: parseTime2Mins(data.start);

			const actLen = +data.actLen;

			return {
				activity: data.activity,
				length: +data.length,
				start: startMins,
				stop: startMins + actLen,
				isFixed: this.check(data.f),
				isRound: this.check(data.r),
				actLen: actLen,
			};
		});
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
