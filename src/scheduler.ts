import type { ActivitiesData, Activity } from './types'
import { check, generateActivityData, parseMins2TodayUnix, parseTime2Mins } from './util/helper'

export class Scheduler {
  activities: Activity[]
  private readonly startMins: number
  private readonly endMins: number
  readonly startUnix: number
  readonly endUnix: number

  constructor(private data: ActivitiesData) {
    this.startMins = parseTime2Mins(data[0].start)
    this.endMins = parseTime2Mins(data[data.length - 1].start)

    if (this.endMins < this.startMins) {
      this.endMins = this.endMins + 24 * 60
    }

    this.startUnix = parseMins2TodayUnix(this.startMins)
    this.endUnix = parseMins2TodayUnix(this.endMins)

    this.init()
  }

  private init() {
    this.activities = this.data.map((act, i) => {
      const startMins = i === this.data.length - 1 ? this.endMins : parseTime2Mins(act.start)

      const actLen = +act.actLen

      return {
        activity: act.activity,
        length: +act.length,
        start: startMins,
        stop: startMins + actLen,
        isFixed: check(act.f),
        isRigid: check(act.r),
        actLen: actLen,
      }
    })
  }

  schedule() {
    const duration = this.endMins - this.startMins
    const parts = this.divideParts(duration, this.activities)
    const scheduledActivities = parts.flatMap((part) =>
      this.schedulePart(part.duration, part.activities)
    )
    this.activities = scheduledActivities
  }

  private divideParts(duration: number, activities: Activity[]) {
    let partIndex = 0
    let usedDuration = 0

    const parts: {
      duration: number
      activities: Activity[]
    }[] = [
      {
        duration: duration,
        activities: [],
      },
    ]

    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i]
      const nextActivity = activities[i + 1]

      parts[partIndex].activities.push(activity)

      if (nextActivity && nextActivity.isFixed) {
        const part = parts[partIndex]
        part.duration = nextActivity.start - part.activities[0].start
        usedDuration += part.duration
        parts[++partIndex] = {
          duration: duration - usedDuration,
          activities: [],
        }
      }
    }

    return parts
  }

  private schedulePart(duration: number, activities: Activity[]): Activity[] {
    if (activities.length === 1) {
      const activity = activities[0]
      return [
        {
          ...activity,
          actLen: duration,
          stop: activity.start + duration,
        },
      ]
    }

    const total = activities.reduce((sum, act) => sum + act.length, 0)

    const isAllRigid = activities.length > 1 && activities.every((a) => a.isRigid)

    const rigidTotal = activities
      .filter((act) => act.isRigid)
      .reduce((sum, act) => sum + act.length, 0)

    let offsetValue = rigidTotal

    if (isAllRigid) {
      offsetValue = 0
    }

    // if (!isAllRound && totalRound > duration) {
    //   offsetValue = duration - duration * (total / totalRound)
    // }

    const ret = activities.reduce((arr, act, i) => {
      let actLen = 0

      if (act.length > 0) {
        if (act.isRigid && !isAllRigid) {
          actLen = act.length
        } else {
          actLen = Math.round((duration - offsetValue) * (act.length / (total - offsetValue)))
        }
      }

      const start = i > 0 ? arr[i - 1].stop : act.start

      arr.push({
        ...act,
        actLen,
        start,
        stop: start + actLen,
      })

      return arr
    }, [] as Activity[])

    return ret
  }

  getData() {
    return this.activities.map((a) => generateActivityData(a))
  }
}
