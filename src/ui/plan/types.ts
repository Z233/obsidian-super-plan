import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnKeys } from 'src/constants'
import type { PlanDataItem } from 'src/schemas'

export type PlanTableColumnDef = ColumnDef<PlanDataItem>

export interface CellPosition {
  rowIndex: number
  columnKey: ColumnKeys
}
