import * as z from 'zod'

export const planRecordSchema = z.object({
  F: z.string(),
  Start: z.string(),
  Activity: z.string(),
  Length: z.string(),
  R: z.string(),
})

export const planRecordsSchema = z.array(planRecordSchema).nonempty()

export type PlanRecord = z.infer<typeof planRecordsSchema>[number]
