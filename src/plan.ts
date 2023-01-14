import type { Activities, ActivitiesData, Activity, ActivityData } from './types'
import {
  generateActivityData,
  parseMins2Time,
  parseMins2TodayUnix,
  parseTime2Mins,
} from './utils/helper'
import { schedule } from './utils/schedule'

export class Plan {
  activities: Activities
  private readonly startMins: number
  private readonly endMins: number
  readonly startUnix: number
  readonly endUnix: number

  constructor(activitiesData: ActivityData[]) {
    this.startMins = parseTime2Mins(activitiesData[0].start)
    this.endMins = parseTime2Mins(activitiesData[activitiesData.length - 1].start)

    if (this.endMins < this.startMins) {
      this.endMins = this.endMins + 24 * 60
    }

    this.startUnix = parseMins2TodayUnix(this.startMins)
    this.endUnix = parseMins2TodayUnix(this.endMins)

    this.activities = this.convertData(activitiesData)
  }

  schedule() {
    const duration = this.endMins - this.startMins
    const scheduledActivities = schedule(duration, this.activities)
    this.activities = scheduledActivities
  }

  update(index: number, activity: Activity) {
    const origin = this.activities[index]
    if (!origin) return
    this.activities[index] = activity
  }

  getData() {
    return this.generateData(this.activities)
  }

  private convertData(activitiesData: ActivityData[]): Activities {
    return activitiesData.map((data, i) => {
      const startMins = i === activitiesData.length - 1 ? this.endMins : parseTime2Mins(data.start)

      const actLen = +data.actLen

      return {
        activity: data.activity,
        length: +data.length,
        start: startMins,
        stop: startMins + actLen,
        isFixed: this.check(data.f),
        isRound: this.check(data.r),
        actLen: actLen,
      }
    })
  }

  private check(value: string) {
    return value === 'x' ? true : false
  }

  private generateData(activities: Activity[]): ActivitiesData {
    return activities.map((a) => generateActivityData(a))
  }
}
