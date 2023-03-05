import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { useEffect, useState, type FC } from 'preact/compat'
import type { MdTableEditor } from 'src/editor/md-table-editor'
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

export const PlanTable: FC<{ initialData: PlanData; mte: MdTableEditor }> = (props) => {
  const { initialData, mte } = props

  const [data, setData] = useState<PlanData>([])

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    const scheduler = new Scheduler(initialData)
    scheduler.schedule()

    const scheduledData = scheduler.getData()

    setData(scheduledData)

    // Iterate over the scheduled data and compare it to the old data.
    // If there are any changes, get the row and column of the change.
    for (let row = 0; row < scheduledData.length; row++) {
      const oldItem = initialData[row]
      const newItem = scheduledData[row]

      Object.entries(newItem).forEach(([k, value], col) => {
        const key = k as keyof PlanDataItem
        if (oldItem[key] !== value) {
          mte.updateCell(row, col, value)
        }
      })
    }
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
