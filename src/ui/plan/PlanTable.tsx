import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { useEffect, useState, type FC } from 'preact/compat'
import type { JSXInternal } from 'preact/src/jsx'
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

export type FocusPosition = {
  rowIndex: number
  columnKey: ColumnKeys
}

export const PlanTable: FC<{ initialData: PlanData }> = (props) => {
  const { initialData } = props
  const { setFocus, getFocus } = usePlanContext()
  const [focusedPosition, setFocusedPosition] = useState<Maybe<FocusPosition>>()

  const saveFocus = (focusPosition: Maybe<FocusPosition>) => {
    if (focusPosition) {
      setFocus(focusPosition)
      setFocusedPosition(focusPosition)
    } else {
      setFocus(null)
      setFocusedPosition(null)
    }
  }

  const table = useReactTable({
    data: initialData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleCellFocus = (rowIndex: number, columnKey: ColumnKeys) => {
    saveFocus({ rowIndex, columnKey })
  }

  const handleBlur: JSXInternal.FocusEventHandler<HTMLElement> = (e) => {
    const relatedTarget = e.relatedTarget

    if (relatedTarget) {
      const path = (e as any).path as HTMLElement[]
      const startIndex = path.indexOf(relatedTarget as HTMLElement)

      let isWithinTable = false

      for (let i = startIndex; i < path.length; i++) {
        const el = path[i]
        if (el && el.dataset?.row && el.dataset?.column) {
          isWithinTable = true
          break
        }
      }

      console.log(isWithinTable)

      !isWithinTable && saveFocus(null)
    }
  }

  useEffect(() => {
    const focus = getFocus()
    if (focus) {
      setFocusedPosition(focus)
    }
  }, [])

  return (
    <table onBlur={handleBlur}>
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
                  data-row={row.index}
                  data-column={cell.column.id}
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
