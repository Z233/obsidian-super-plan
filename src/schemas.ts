import * as z from 'zod'
import { ColumnKeys, ColumnKeysMap, Columns } from './constants'

export const planRecordSchema = z.object({
  ID: z.string(),
  F: z.string(),
  Start: z.string(),
  Activity: z.string(),
  Length: z.string(),
  R: z.string(),
  ActLen: z.string(),
})

export const planRecordsSchema = z.array(planRecordSchema).nonempty()

export type PlanRecord = z.infer<typeof planRecordSchema>

export const planDataItemSchema = z.object({
  [ColumnKeysMap[Columns.ID]]: z.string(),
  [ColumnKeysMap[Columns.F]]: z.string(),
  [ColumnKeysMap[Columns.Start]]: z.string(),
  [ColumnKeysMap[Columns.Activity]]: z.string(),
  [ColumnKeysMap[Columns.Length]]: z.string(),
  [ColumnKeysMap[Columns.R]]: z.string(),
  [ColumnKeysMap[Columns.ActLen]]: z.string(),
})

export type PlanDataItem = z.infer<typeof planDataItemSchema>

const planRecordsTransformer = (input: z.infer<typeof planRecordsSchema>) => {
  const output: PlanDataItem[] = []
  for (const record of input) {
    const item: PlanDataItem = {
      [ColumnKeys.ID]: '',
      [ColumnKeys.F]: '',
      [ColumnKeys.Start]: '',
      [ColumnKeys.Activity]: '',
      [ColumnKeys.Length]: '',
      [ColumnKeys.R]: '',
      [ColumnKeys.ActLen]: '',
    }
    for (const [column, value] of Object.entries(record)) {
      const key = ColumnKeysMap[Columns[column as keyof typeof Columns]]
      item[key] = value
    }
    output.push(item)
  }
  return output
}

export const planDataSchema = planRecordsSchema.transform(planRecordsTransformer)

export type PlanData = z.infer<typeof planDataSchema>
