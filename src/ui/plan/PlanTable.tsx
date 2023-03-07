import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import type { FC } from 'preact/compat'
import type { PlanData, PlanDataItem } from 'src/schemas'
import { renderCheckboxCell } from './cells'

export type PlanTableColumnDef = ColumnDef<PlanDataItem>

export const tableColumns: PlanTableColumnDef[] = [
  {
    header: 'F',
    accessorKey: 'f',
    cell: renderCheckboxCell,
  },
  {
    header: 'Start',
    accessorKey: 'start',
  },
  {
    header: 'Activity',
    accessorKey: 'activity',
  },
  {
    header: 'Length',
    accessorKey: 'length',
  },
  {
    header: 'R',
    accessorKey: 'r',
    cell: renderCheckboxCell,
  },
  {
    header: 'ActLen',
    accessorKey: 'actLen',
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
            {row.getVisibleCells().map((cell) => (
              <td key={cell.column.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
