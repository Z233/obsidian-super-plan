import type { Activity } from 'src/types'

export function schedule(duration: number, activities: Activity[]) {
  const parts = divideParts(duration, activities)

  const scheduledActivities = parts.flatMap((part) =>
    schedulePart(part.duration, part.activities)
  )

  return scheduledActivities
}

function divideParts(duration: number, activities: Activity[]) {
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

function schedulePart(
  duration: number,
  activities: Activity[]
): Activity[] {
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

  // 如果都是固定的，也按比例分配
  const isAllRound =
    activities.length > 1 && activities.every((a) => a.isRound)

  const totalRound = activities
    .filter((act) => act.isRound)
    .reduce((sum, act) => sum + act.length, 0)

  // 计算偏移量
  let offsetValue = totalRound

  if (isAllRound) {
    offsetValue = 0
  }

  // if (!isAllRound && totalRound > duration) {
  //   offsetValue = duration - duration * (total / totalRound)
  // }

  const ret = activities.reduce((arr, act, i) => {
    let actLen = 0

    if (act.length > 0) {
      if (act.isRound && !isAllRound) {
        actLen = act.length
      } else {
        actLen = Math.round(
          (duration - offsetValue) *
            (act.length / (total - offsetValue))
        )
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
