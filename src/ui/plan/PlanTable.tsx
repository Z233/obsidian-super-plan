import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import type { FC } from 'preact/compat'
import { ColumnKeys } from 'src/constants'
import type { PlanData, PlanDataItem } from 'src/schemas'
import {
  renderActivityCell,
  renderActLenCell,
  renderCheckboxCell,
  renderLengthCell,
  renderStartCell,
} from './cells'

export type PlanTableColumnDef = ColumnDef<PlanDataItem>

export const tableColumns: PlanTableColumnDef[] = [
  {
    header: 'F',
    accessorKey: ColumnKeys.F,
    cell: renderCheckboxCell,
  },
  {
    header: 'Start',
    accessorKey: ColumnKeys.Start,
    cell: renderStartCell,
  },
  {
    header: 'Activity',
    accessorKey: ColumnKeys.Activity,
    cell: renderActivityCell,
  },
  {
    header: 'Length',
    accessorKey: ColumnKeys.Length,
    cell: renderLengthCell,
  },
  {
    header: 'R',
    accessorKey: ColumnKeys.R,
    cell: renderCheckboxCell,
  },
  {
    header: 'ActLen',
    accessorKey: ColumnKeys.ActLen,
    cell: renderActLenCell,
  },
]

export const PlanTable: FC<{ initialData: PlanData }> = (props) => {
  const { initialData } = props

  const table = useReactTable({
    data: initialData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.column.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row
              .getVisibleCells()
              .map((cell) => flexRender(cell.column.columnDef.cell, cell.getContext()))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
