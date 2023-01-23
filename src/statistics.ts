import { Plan } from './plan'
import type { ActivitiesData } from './types'

export function generateDailyStatisticsLines(activitiesData: ActivitiesData, title: string) {
  const plan = new Plan(activitiesData)
  const data = plan.generateStatistics()

  const first = `Schedule Totals: ${title} (${plan.getTotalHours()} h)`
  let lines = [first]

  for (let i = 0; i < data.length; i++) {
    const item = data[i]
    lines.push(`${i + 1}. ${item.name} ${item.total} mins.`)
    item.children?.forEach((c) => lines.push(`\t- ${c.total} ${c.name}`))
  }

  return lines
}
