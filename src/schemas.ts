import * as z from 'zod'

export const planRecordSchema = z.object({
  F: z.string(),
  Start: z.string(),
  Activity: z.string(),
  Length: z.string(),
  R: z.string(),
  ActLen: z.string(),
})

export const planRecordsSchema = z.array(planRecordSchema).nonempty()

export type PlanRecord = z.infer<typeof planRecordSchema>

const PlanDataAttributeMap = {
  F: 'f',
  Start: 'start',
  Activity: 'activity',
  Length: 'length',
  R: 'r',
  ActLen: 'actLen',
} as const

export const planDataItemSchema = z.object({
  f: z.string(),
  start: z.string(),
  activity: z.string(),
  length: z.string(),
  r: z.string(),
  actLen: z.string(),
})

// TODO: Change to tuple
export type PlanDataItem = z.infer<typeof planDataItemSchema>

const planRecordsTransformer = (input: z.infer<typeof planRecordsSchema>) => {
  const output: PlanDataItem[] = []
  for (const record of input) {
    const item: PlanDataItem = {
      f: '',
      start: '',
      activity: '',
      length: '',
      r: '',
      actLen: '',
    }
    for (const [key, value] of Object.entries(record)) {
      const attr = PlanDataAttributeMap[key as keyof typeof PlanDataAttributeMap]
      item[attr] = value
    }
    output.push(item)
  }
  return output
}

export const planDataSchema = planRecordsSchema.transform(planRecordsTransformer)

export type PlanData = z.infer<typeof planDataSchema>
