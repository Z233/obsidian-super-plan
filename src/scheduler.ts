import { nanoid } from 'nanoid'
import { INVAlID_NUMBER_LITERAL } from './constants'
import type { PlanData } from './schemas'
import type { Activity, ScheduledActivity } from './types'
import { check, formatNumberCell, getNowMins, parseMins2Time, parseTime2Mins } from './util/helper'

type SchedulerPart = {
  duration: number
  activities: ScheduledActivity[]
}

export class Scheduler {
  activities: ScheduledActivity[]
  private startMins: number
  private endMins: number
  startUnix: number
  endUnix: number

  constructor(data: Activity[]) {
    this.init(data)
  }

  private init(data: Activity[]) {
    // Init activities
    const activities: ScheduledActivity[] = data.map((act) => {
      const isFixed = check(act.f)

      return {
        id: act.id,
        activity: act.activity,
        length: +act.length,
        start: isFixed ? parseTime2Mins(act.start) : 0,
        stop: 0,
        isFixed,
        isRigid: check(act.r),
        actLen: 0,
      }
    })
    
    this.activities = activities
    this.schedule()

    this.startMins = this.activities[0].start
    this.endMins = this.activities[this.activities.length - 1].start

    // Compute startUnix and endUnix
    let d = new Date()
    d.setSeconds(0, 0)

    const nowMins = getNowMins()
    const nowUnix = d.getTime() / 1000

    let startUnix = nowUnix - (nowMins - this.startMins) * 60
    let endUnix = nowUnix + (this.endMins - nowMins) * 60

    // If not same date, means `nowUnix` is in the next day
    // So we need to minus 24 hours
    const isSameDate = nowMins >= this.startMins
    if (!isSameDate) {
      startUnix -= 24 * 60 * 60
      endUnix -= 24 * 60 * 60
    }

    this.startUnix = startUnix
    this.endUnix = endUnix
  }

  schedule() {
    const parts = this.divideParts(this.activities).map((p) => ({
      duration: p.duration,
      activities: this.schedulePart(p.duration, p.activities),
    }))
    
    const scheduledActivities: ScheduledActivity[] = this.mergeParts(parts)
    this.activities = scheduledActivities
  }

  private mergeParts(parts: SchedulerPart[]) {
    const partsToMerge = parts.concat()

    const mergedActivities: ScheduledActivity[] = [...partsToMerge[0].activities]
    for (let i = 1; i < partsToMerge.length; i++) {
      const activities = partsToMerge[i].activities
      const prevPart = partsToMerge[i - 1]

      activities[0].start = prevPart.activities[prevPart.activities.length - 1].stop

      mergedActivities.push(...activities)
    }

    return mergedActivities
  }

  private divideParts(activities: ScheduledActivity[]) {
    const parts: SchedulerPart[] = [
      {
        duration: 0,
        activities: [],
      },
    ]

    for (let i = 0, partIndex = 0; i < activities.length; i++) {
      const activity = activities[i]
      const nextActivity = activities[i + 1]

      parts[partIndex].activities.push(activity)

      if (!nextActivity?.isFixed) continue

      const lastPart = parts[partIndex]

      let lastPartStart = lastPart.activities[0].start
      let lastPartEnd = nextActivity.start

      while (lastPartEnd < lastPartStart) {
        lastPartEnd += 24 * 60
      }

      lastPart.duration = lastPartEnd - lastPartStart

      parts[++partIndex] = {
        duration: 0,
        activities: [],
      }
    }

    return parts
  }

  private schedulePart(duration: number, activities: ScheduledActivity[]): ScheduledActivity[] {
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
    let floatOffsetValue = 0

    if (isAllRigid) {
      offsetValue = 0
    }

    const ret = activities.reduce((arr, act, i) => {
      let actLen = 0

      if (act.isRigid && !isAllRigid) {
        actLen = act.length
      } else {
        let floatLen = (duration - offsetValue) * (act.length / (total - offsetValue))
        floatLen = Number.isNaN(floatLen) ? 0 : floatLen
        actLen = Math.round(floatLen)
        floatOffsetValue += floatLen - actLen
      }

      // Assign floatOffsetValue to last activity
      if (i === activities.length - 1) {
        if (actLen > 0) {
          actLen += Math.round(floatOffsetValue)
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
    }, [] as ScheduledActivity[])

    return ret
  }

  getData(): PlanData {
    return this.activities.map((act) => ({
      id: act.id,
      f: act.isFixed ? 'x' : '',
      start: Number.isNaN(act.start) ? INVAlID_NUMBER_LITERAL : parseMins2Time(act.start),
      activity: act.activity,
      length: formatNumberCell(act.length),
      r: act.isRigid ? 'x' : '',
      actLen: formatNumberCell(act.actLen),
    }))
  }

  getTotalMins() {
    const first = this.activities.at(0)
    const last = this.activities.at(-1)

    if (!first?.start || !last?.stop) return 0

    return last.stop - first.start
  }
}
