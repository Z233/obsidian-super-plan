import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { useEffect, useState, type FC, createElement, useRef, useLayoutEffect } from 'preact/compat'
import type { JSXInternal } from 'preact/src/jsx'
import { ColumnKeys, ColumnKeysMap, Columns } from 'src/constants'
import { Events, GlobalMediator } from 'src/mediator'
import type { PlanData, PlanDataItem } from 'src/schemas'
import type { Maybe } from 'src/types'
import {
  renderActivityCell,
  renderActLenCell,
  renderCheckboxCell,
  renderLengthCell,
  renderStartCell,
  type CellProps,
} from './cells'
import { usePlan } from './context'
import { DragLayer } from './DragLayer'
import { focusStyle, indexCellStyle } from './styles'
import { TableRow } from './TableRow'
import type { CellPosition, PlanTableColumnDef } from './types'


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

export const PlanTable: FC<{ data: PlanData }> = (props) => {
  const { data } = props
  const { insertRowBelow } = usePlan()

  const [highlightedCell, setHighlightedCell] = useState<Maybe<CellPosition>>()
  const focusableElementsRef = useRef<Map<string, HTMLInputElement>>(new Map())

  const updateFocusableElement = (position: CellPosition, element: Maybe<HTMLInputElement>) => {
    const { rowIndex, columnKey } = position
    const key = `${rowIndex}-${columnKey}`
    if (element) {
      focusableElementsRef.current.set(key, element)
    } else {
      focusableElementsRef.current.delete(key)
    }
  }

  if (highlightedCell) {
    const { rowIndex, columnKey } = highlightedCell
    setImmediate(() => {
      const el = focusableElementsRef.current.get(`${rowIndex}-${columnKey}`)
      if (el) {
        el.focus()
      }
    })
  }

  const [highlightedId, setHighlightedId] = useState('')

  const table = useReactTable({
    data: data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleCellFocus = (rowIndex: number, columnKey: ColumnKeys) => {
    setHighlightedCell({ rowIndex, columnKey })
  }

  const handleCellMouseDown: JSXInternal.MouseEventHandler<HTMLTableCellElement> = (e) => {
    // Disable default behavior for right click
    if (e.button === 2) {
      setHighlightedCell(null)
      e.preventDefault()
      return false
    }
  }

  const handleCellKeyDown = (e: KeyboardEvent, rowIndex: number, columnKey: ColumnKeys) => {
    const { key } = e
    // Binding Enter
    if (key === 'Enter' && highlightedCell) {
      // Move to next column or create new row
      const column = ColumnKeysMap[columnKey]
      const tableHeight = table.getRowModel().rows.length

      let nextColumn = (column + 1) as Columns
      let nextRowIndex = rowIndex

      const isLastColumn = nextColumn > Columns.R

      if (isLastColumn) {
        nextColumn = Columns.Activity
        nextRowIndex += 1
      }

      const isLastRow = nextRowIndex === tableHeight - 1
      if (isLastColumn && isLastRow) {
        insertRowBelow(rowIndex)
        Promise.resolve().then(() => {
          setHighlightedCell({ rowIndex: nextRowIndex, columnKey: ColumnKeysMap[nextColumn] })
        })
        return
      }

      setHighlightedCell({ rowIndex: nextRowIndex, columnKey: ColumnKeysMap[nextColumn] })
    }
  }

  const handleBlur: JSXInternal.FocusEventHandler<HTMLElement> = (e) => {
    highlightedId && setHighlightedId('')

    const relatedTarget = e.relatedTarget as Maybe<HTMLElement>
    const isWithinTable = Boolean(
      relatedTarget && relatedTarget.matchParent('[data-row][data-column]')
    )

    !isWithinTable && setHighlightedCell(null)
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

  useEffect(() => {
    const mediator = GlobalMediator.getInstance()
    const unsubscribe = mediator.subscribe(Events.JUMP_TO_ACTIVITY, ({ activityId }) => {
      setHighlightedId(activityId)
      setHighlightedCell({
        rowIndex: data.findIndex((act) => act.id === activityId),
        columnKey: ColumnKeys.Activity,
      })
    })

    return () => {
      unsubscribe()
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
            <TableRow
              key={row.original.id}
              row={row}
              highlighted={highlightedId === row.original.id}
              highlightRow={setHighlightedId}
              setHighlightedCell={setHighlightedCell}
            >
              {row.getVisibleCells().map((cell) => {
                const isFocused =
                  highlightedId.length <= 0 &&
                  highlightedCell?.rowIndex === row.index &&
                  highlightedCell?.columnKey === cell.column.id

                return (
                  <td
                    key={`${cell.column.id}-${row.original[cell.column.id as ColumnKeys]}`}
                    data-row={row.index}
                    data-column={cell.column.id}
                    onMouseDown={handleCellMouseDown}
                    onKeyDown={(e) => handleCellKeyDown(e, row.index, cell.column.id as ColumnKeys)}
                    onFocus={() => handleCellFocus(row.index, cell.column.id as ColumnKeys)}
                    className={isFocused ? focusStyle : ''}
                  >
                    {flexRender<CellProps>(cell.column.columnDef.cell, {
                      ...cell.getContext(),
                      updateFocusableElement,
                      highlightedCell: highlightedCell,
                    })}
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
