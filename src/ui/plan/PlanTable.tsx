import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { useEffect, useState, type FC } from 'preact/compat'
import type { TableEditor } from 'src/editor/table-editor'
import { Scheduler } from 'src/scheduler'
import type { PlanData, PlanDataItem } from 'src/schemas'

const tableColumns: ColumnDef<PlanDataItem>[] = [
  {
    header: 'F',
    accessorKey: 'f',
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
  },
  {
    header: 'ActLen',
    accessorKey: 'actLen',
  },
]

export const PlanTable: FC<{ initialData: PlanData; te: TableEditor }> = (props) => {
  const { initialData, te } = props

  const [data, setData] = useState<PlanData>([])

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    const scheduler = new Scheduler(initialData)
    scheduler.schedule()
    setData(scheduler.getData())
  }, [initialData])

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
