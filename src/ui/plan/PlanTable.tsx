import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import type { FC } from 'preact/compat'
import { planRecordSchema, type PlanRecord } from 'src/schemas'

const headerEnum = planRecordSchema.keyof().Enum

const tableColumns: ColumnDef<PlanRecord>[] = [
  {
    header: headerEnum.F,
    accessorKey: 'f',
    accessorFn: (record) => record.F,
  },
  {
    header: headerEnum.Start,
    accessorKey: 'start',
    accessorFn: (record) => record.Start,
  },
  {
    header: headerEnum.Activity,
    accessorKey: 'activity',
    accessorFn: (record) => record.Activity,
  },
  {
    header: headerEnum.Length,
    accessorKey: 'length',
    accessorFn: (record) => record.Length,
  },
  {
    header: headerEnum.R,
    accessorKey: 'r',
    accessorFn: (record) => record.R,
  },
]

export const PlanTable: FC<{ records: PlanRecord[] }> = (props) => {
  const table = useReactTable({
    data: props.records,
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
