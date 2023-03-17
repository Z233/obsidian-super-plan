import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { useEffect, useState, type FC, createElement, useRef } from 'preact/compat'
import type { JSXInternal } from 'preact/src/jsx'
import { ColumnKeys, ColumnKeysMap, Columns } from 'src/constants'
import type { PlanData, PlanDataItem } from 'src/schemas'
import {
  renderActivityCell,
  renderActLenCell,
  renderCheckboxCell,
  renderLengthCell,
  renderStartCell,
} from './cells'
import { usePlanContext } from './context'
import { DragLayer } from './DragLayer'
import { focusStyle, indexCellStyle } from './styles'
import { TableRow } from './TableRow'

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

export const PlanTable: FC<{ data: PlanData }> = (props) => {
  const { data } = props
  const { deleteRow, insertRowBelow, focusedPosition, setFocusedPosition } = usePlanContext()

  const [highlightedRow, setHighlightedRow] = useState(-1)

  const table = useReactTable({
    data: data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleCellFocus = (rowIndex: number, columnKey: ColumnKeys) => {
    setFocusedPosition({ rowIndex, columnKey })
  }

  const handleCellMouseDown: JSXInternal.MouseEventHandler<HTMLTableCellElement> = (e) => {
    // Disable default behavior for right click
    if (e.button === 2) {
      setFocusedPosition(null)
      e.preventDefault()
      return false
    }
  }

  const handleCellKeyDown = (e: KeyboardEvent, rowIndex: number, columnKey: ColumnKeys) => {
    const { key } = e
    // Binding Enter
    if (key === 'Enter' && focusedPosition) {
      // Move to next column or create new row
      const column = ColumnKeysMap[columnKey]

      let nextColumn = ((column + 1) % tableColumns.length) as Columns
      let nextRowIndex = rowIndex

      if (nextColumn > Columns.R) {
        nextColumn = Columns.Activity
        nextRowIndex += 1
        setFocusedPosition({ rowIndex: nextRowIndex, columnKey: ColumnKeysMap[nextColumn] })
        insertRowBelow(rowIndex)
      } else {
        setFocusedPosition({ rowIndex: nextRowIndex, columnKey: ColumnKeysMap[nextColumn] })
      }
    }
  }

  const handlePlusClick = (rowIndex: number) => {
    insertRowBelow(rowIndex)
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

      !isWithinTable && setFocusedPosition(null)
    }
  }

  const tableWrapperRef = useRef<HTMLTableElement>(null)
  const [tableWrapperInfo, setTableWrapperInfo] = useState<{
    offsetY: number
    height: number
    width: number
  }>()

  useEffect(() => {
    if (tableWrapperRef.current) {
      const clientRect = tableWrapperRef.current.getBoundingClientRect()
      setTableWrapperInfo({
        offsetY: clientRect.top,
        height: clientRect.height,
        width: clientRect.width,
      })
    }
  }, [])

  return (
    <div className="relative">
      <DragLayer
        parentOffsetY={tableWrapperInfo?.offsetY ?? 0}
        parentHeight={tableWrapperInfo?.height ?? 0}
        width={tableWrapperInfo?.width ?? 0}
      />
      <table ref={tableWrapperRef} className="relative" onBlur={handleBlur}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="![&>*:nth-child(2)]:border-l-0">
              <th className={indexCellStyle}>#</th>
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
            <TableRow key={row.original.id} row={row}>
              {row.getVisibleCells().map((cell) => {
                const isFocused =
                  highlightedRow < 0 &&
                  focusedPosition?.rowIndex === row.index &&
                  focusedPosition?.columnKey === cell.column.id

                return (
                  <td
                    data-row={row.index}
                    data-column={cell.column.id}
                    onMouseDown={handleCellMouseDown}
                    onKeyDown={(e) => handleCellKeyDown(e, row.index, cell.column.id as ColumnKeys)}
                    onFocus={() => handleCellFocus(row.index, cell.column.id as ColumnKeys)}
                    className={isFocused ? focusStyle : ''}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                )
              })}
            </TableRow>
          ))}
        </tbody>
      </table>
    </div>
  )
}
