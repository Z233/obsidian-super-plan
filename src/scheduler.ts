import type { ActivitiesData, Activity } from './types'
import { check, generateActivityData, getNowMins, parseTime2Mins } from './util/helper'

export class Scheduler {
  activities: Activity[]
  private startMins: number
  private endMins: number
  startUnix: number
  endUnix: number

  constructor(data: ActivitiesData) {
    this.init(data)
  }

  private init(data: ActivitiesData) {
    // Init activities
    const activities: Activity[] = data.map((act) => ({
      activity: act.activity,
      length: +act.length,
      start: parseTime2Mins(act.start),
      stop: 0,
      isFixed: check(act.f),
      isRigid: check(act.r),
      actLen: 0,
    }))

    for (let idx = 1; idx < activities.length; idx++) {
      const act = activities[idx]
      const prevAct = activities[idx - 1]

      const start = act.start < prevAct.start ? act.start + 24 * 60 : act.start

      activities[idx] = {
        ...act,
        start,
      }
    }

    this.activities = activities
    this.startMins = this.activities[0].start
    this.endMins = this.activities[this.activities.length - 1].start

    // Compute startUnix and endUnix
    let d = new Date()
    d.setSeconds(0, 0)

    const nowMins = getNowMins()
    const nowUnix = d.getTime() / 1000

    let startUnix = nowUnix - (nowMins - this.startMins) * 60
    let endUnix = nowUnix + (this.endMins - nowMins) * 60

    const isSameDate = nowMins >= this.startMins
    if (!isSameDate) {
      startUnix -= 24 * 60 * 60
      endUnix -= 24 * 60 * 60
    }

    this.startUnix = startUnix
    this.endUnix = endUnix
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
