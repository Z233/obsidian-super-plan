import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { useEffect, useState, type FC } from 'preact/compat'
import { ColumnKeys } from 'src/constants'
import type { PlanData, PlanDataItem } from 'src/schemas'
import type { Maybe } from 'src/types'
import {
  renderActivityCell,
  renderActLenCell,
  renderCheckboxCell,
  renderLengthCell,
  renderStartCell,
} from './cells'
import { usePlanContext } from './context'
import { focusStyle } from './styles'

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
  const { setFocus, getFocus } = usePlanContext()
  const [focusedPosition, setFocusedPosition] = useState<
    Maybe<{
      rowIndex: number
      columnKey: ColumnKeys
    }>
  >()

  const table = useReactTable({
    data: initialData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleCellFocus = (rowIndex: number, columnKey: ColumnKeys) => {
    setFocus(rowIndex, columnKey)
    setFocusedPosition({ rowIndex, columnKey })
  }

  useEffect(() => {
    const focus = getFocus()
    if (focus) {
      setFocusedPosition({ rowIndex: focus.row, columnKey: focus.columnKey })
    }
  }, [])

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
            {row.getVisibleCells().map((cell) => {
              const isFocused =
                focusedPosition?.rowIndex === row.index &&
                focusedPosition?.columnKey === cell.column.id

              return (
                <td
                  onFocus={() => handleCellFocus(row.index, cell.column.id as ColumnKeys)}
                  className={isFocused ? focusStyle : ''}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
